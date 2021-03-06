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

package org.msjs.script;

import com.google.inject.Binder;
import com.google.inject.Guice;
import com.google.inject.Injector;
import com.google.inject.Module;
import com.google.inject.util.Modules;
import org.apache.log4j.Logger;
import org.junit.Before;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.ContextFactory;
import org.mozilla.javascript.JavaScriptException;
import org.mozilla.javascript.Script;
import org.msjs.config.BasicConfiguration;
import org.msjs.config.MsjsConfiguration;
import org.msjs.config.MsjsModule;

import java.io.Reader;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public abstract class BaseScriptTest {
    protected static final Logger logger = Logger.getLogger(TestMsjs.class);
    private MsjsConfiguration config;
    private Injector injector;
    private ContextFactory cxFactory;

    @Before
    public void setupConfig() {
        config = BasicConfiguration.getConfiguration();
        injector = getInjector(config);
        cxFactory = injector.getInstance(ContextFactory.class);
    }

    protected void runTest(String testfile)  {
        final MsjsScriptContext context = injector.getInstance(MsjsScriptContext.class);
        String testRoot = getTestDirectory();
        context.setInjector(injector);


        try{
            context.loadPackage(testRoot + "/" + testfile);
        } catch (JavaScriptException e){
            logger.info("Script error: " + e.getMessage());
            org.junit.Assert.fail(e.getScriptStackTrace());
        }
    }

    //Path relative to script root
    abstract protected String getTestDirectory();

    protected Injector getInjector(final MsjsConfiguration config) {
        Module module = Modules.override(new MsjsModule(config)).with(new Module() {
            @Override
            public void configure(final Binder binder) {
                //guarantees to run tasks in order
                ExecutorService executor = Executors.newCachedThreadPool();
                binder.bind(ExecutorService.class).toInstance(executor);
                binder.bind(MsjsConfiguration.class).toInstance(config);
            }
        });
        return Guice.createInjector(module);
    }

    public Script getScript(Reader reader){
        Context cx = cxFactory.enterContext();
        try{
            return cx.compileReader(reader, "test script", 1, null);
        }catch(Exception e){
            throw new RuntimeException(e);
        }finally{
            Context.exit();
        }

    }

}
