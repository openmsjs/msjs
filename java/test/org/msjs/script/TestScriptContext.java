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

import static junit.framework.Assert.assertEquals;
import org.junit.Before;
import org.junit.Test;
import org.mozilla.javascript.ContextFactory;
import org.mozilla.javascript.Scriptable;
import org.msjs.config.MsjsConfiguration;
import org.msjs.config.BasicConfiguration;

import java.io.File;
import java.io.FileReader;
import java.io.Reader;


public class TestScriptContext {
    private String testScriptPath;
    private MsjsConfiguration config;
    private ScriptContext context;
    private ScriptCompiler compiler;

    @Before
    public void setupConfig() {
        config = BasicConfiguration.getConfiguration();
        testScriptPath = config.getScriptRoot() + "/test";
        final ContextFactory cxFactory = new ContextFactory();
        context = new ScriptContext(cxFactory);
        compiler = new ScriptCompiler(cxFactory);

    }

    @Test
    public void simpleTest() throws Exception{
        Reader reader = new FileReader( new File( testScriptPath + "/assign.js"));
        Scriptable result = context.runScript(compiler.compile(reader));

        assertEquals( 1.0, result.get("one", result));
        assertEquals( "2", result.get("two", result));
    }

    public static class TestObject {
        public String publicString = "public";

        public String publicGetString(){
            return publicString;
        }
    }
}
