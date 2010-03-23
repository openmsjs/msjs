/*
 * Copyright (c) 2010 Sharegrove Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

package org.msjs.pages;

import com.google.inject.Inject;
import com.google.inject.Provider;
import com.google.inject.Singleton;
import org.apache.log4j.Logger;
import org.msjs.config.MsjsConfiguration;
import org.msjs.script.MsjsScriptContext;

import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.Callable;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Future;

@Singleton
public class PageContextProvider {

    private static final Logger logger = Logger.getLogger(PageContextProvider.class);
    private final Provider<MsjsScriptContext> scriptContextProvider;
    private final ExecutorService executorService;
    private final ConcurrentHashMap<String, BlockingQueue<Future<MsjsScriptContext>>> contexts;
    private final boolean enablePrefetch;
    private static final int PRELOAD_COUNT = 5;

    @Inject
    public PageContextProvider(Provider<MsjsScriptContext> scriptContextProvider,
                               ExecutorService executorService,
                               MsjsConfiguration config) {
        this.scriptContextProvider = scriptContextProvider;
        this.executorService = executorService;
        contexts = new ConcurrentHashMap<String, BlockingQueue<Future<MsjsScriptContext>>>();
        enablePrefetch = config.getBoolean("msjs.doCache");
        logger.info("Page prefetch " + (enablePrefetch ? "enabled" : "disabled"));
    }

    public MsjsScriptContext get(final String scriptPath, final boolean allowCache) {

        Future<MsjsScriptContext> future;
        try{
            if (enablePrefetch && allowCache){
                BlockingQueue<Future<MsjsScriptContext>> queue = getQueue(scriptPath);
                future = queue.take();
                //replace this item in the queue
                queue.put(getFuture(scriptPath));
            } else {
                future = getFuture(scriptPath);
            }

            return future.get();
        } catch (ExecutionException e){
            Throwable cause = e.getCause();
            if (cause instanceof RuntimeException) throw (RuntimeException) cause;
            else throw new RuntimeException(cause);
        } catch (InterruptedException e){
            throw new RuntimeException(e);
        }

    }

    private BlockingQueue<Future<MsjsScriptContext>> getQueue(final String scriptPath)
            throws InterruptedException, ExecutionException {

        if (!contexts.containsKey(scriptPath)){
            logger.info("New context queue for: " + scriptPath);
            BlockingQueue<Future<MsjsScriptContext>> newQueue =
                    new ArrayBlockingQueue<Future<MsjsScriptContext>>(PRELOAD_COUNT);
            BlockingQueue existingValue = contexts.putIfAbsent(scriptPath, newQueue);
            //If existingValue comes back null, then newQueue got put in the contexts map
            if (existingValue == null){
                //Preload the queue
                for (int i = 0; i < PRELOAD_COUNT; i++){
                    final Future<MsjsScriptContext> future = getFuture(scriptPath);
                    //Block until the first instance is loaded, to allow singletons to load
                    //once, etc.
                    if (i==0) future.get();
                    newQueue.put(future);
                }
            }
        }

        return contexts.get(scriptPath);
    }

    private static final Object[] domArg = {"msjs.dom"};

    private Future<MsjsScriptContext> getFuture(final String scriptPath) {
        final Callable<MsjsScriptContext> callable = new Callable<MsjsScriptContext>() {
            @Override
            public MsjsScriptContext call() throws Exception {
                MsjsScriptContext context = scriptContextProvider.get();
                //load essential packages
                context.callMethod("msjs","require", domArg);
                context.loadPackage(scriptPath);
                //logger.info("LOAD " +scriptPath +":"+(System.currentTimeMillis() - t));


                return context;
            }
        };
        return executorService.submit(callable);
    }

}
