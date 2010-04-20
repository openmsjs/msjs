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

import com.google.inject.Guice;
import static junit.framework.Assert.assertTrue;
import org.junit.Before;
import org.junit.Test;
import org.mozilla.javascript.ContextFactory;
import org.msjs.config.MsjsConfiguration;
import org.msjs.config.BasicConfiguration;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileReader;
import java.io.IOException;
import java.io.Reader;

public class TestMsjsScriptContext {
    private MsjsScriptContext cx;
    private MsjsConfiguration config;
    private ContextFactory cxFactory;
    private ScriptCompiler compiler;


    @Before
    public void setupConfig() {
        config = BasicConfiguration.getConfiguration();
        cxFactory = new ContextFactory();
        final ScriptLocator locator = new ScriptLocator(config, cxFactory);
        cx = new MsjsScriptContext(cxFactory, locator,
                                   new FunctionParser(cxFactory));
        cx.setInjector(Guice.createInjector());
        compiler = new ScriptCompiler(cxFactory);
    }

    @Test
    public void testLogging(){
        cx.log( "This is an expected log message");
    }

    @Test
    public void runScriptSuccess() throws IOException {
        Reader reader = getFileReader(config.getScriptRoot() + "/test/assign.js");
        cx.runScript(compiler.compile(reader), cx.makeObject());
    }

    @Test
    public void loadPackageFailure() {
        boolean didException = false;
        try{
            cx.loadPackage( "not.there.ok");
        }catch(Exception e){
            didException = true;
            assertTrue(e.getCause() instanceof FileNotFoundException);
        }
        assertTrue(didException);

    }

    private Reader getFileReader(String path) throws FileNotFoundException {
        File f = new File(path);
        return new FileReader(f);

    }

}
