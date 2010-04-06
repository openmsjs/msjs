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

package org.msjs.config;

import com.google.inject.Binder;
import com.google.inject.Module;
import com.google.inject.name.Names;
import org.apache.http.client.HttpClient;
import org.apache.http.conn.ClientConnectionManager;
import org.apache.http.conn.scheme.PlainSocketFactory;
import org.apache.http.conn.scheme.Scheme;
import org.apache.http.conn.scheme.SchemeRegistry;
import org.apache.http.conn.ssl.SSLSocketFactory;
import org.apache.http.impl.client.DefaultHttpClient;
import org.apache.http.impl.conn.tsccm.ThreadSafeClientConnManager;
import org.mozilla.javascript.ContextFactory;
import org.msjs.script.MsjsContextFactory;
import org.msjs.script.ScriptContext;

import java.util.Timer;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Guice Module for msjs Servlets.
 */
public class MsjsModule implements Module {
    private final ExecutorService executorService;
    private final ClientConnectionManager connectionManager;
    private final Timer timer;
    private final MsjsConfiguration config;


    /**
     * Constructs a guice module for msjs.
     *
     * @param config The configuration for the application.
     */
    public MsjsModule(MsjsConfiguration config) {
        this.config = config;
        executorService = Executors.newCachedThreadPool();
        connectionManager = getConnectionManager();
        timer = new Timer();
    }

    private ClientConnectionManager getConnectionManager() {
        SchemeRegistry schemeRegistry = new SchemeRegistry();
        schemeRegistry.register(new Scheme("http", PlainSocketFactory.getSocketFactory(), 80));
        schemeRegistry.register(new Scheme("https", SSLSocketFactory.getSocketFactory(), 443));
        ThreadSafeClientConnManager manager = new ThreadSafeClientConnManager(schemeRegistry);
        manager.setMaxTotalConnections(10);
        return manager;
    }

    @Override
    public void configure(final Binder binder) {
        binder.bind(MsjsConfiguration.class).toInstance(config);
        final MsjsContextFactory msjsContextFactory = new MsjsContextFactory();
        binder.bind(ContextFactory.class).toInstance(msjsContextFactory);
        binder.bind(ExecutorService.class).toInstance(executorService);
        binder.bind(HttpClient.class).toInstance(new DefaultHttpClient(connectionManager));
        binder.bind(Timer.class).toInstance(timer);
        binder.bind(ScriptContext.class)
                .annotatedWith(Names.named("JSONContext"))
                .toInstance(new ScriptContext(msjsContextFactory));
    }

    public void shutdown() {
        executorService.shutdown();
        connectionManager.shutdown();
        timer.cancel();
    }
}
