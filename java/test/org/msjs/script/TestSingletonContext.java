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
import org.apache.log4j.Logger;
import org.junit.Test;

import java.util.concurrent.ExecutionException;

public class TestSingletonContext {
    private static final Logger logger = Logger.getLogger(TestSingletonScope.class);

    private final ScriptContextTestProvider provider = new ScriptContextTestProvider();
    private MsjsScriptContext getMsjsScriptContext() {
        return provider.get();
    }

    @Test
    public void testScopes() throws InterruptedException, ExecutionException {
        final String testScript = "test.singletoncontext";
        MsjsScriptContext context1 = getMsjsScriptContext();
        MsjsScriptContext context2 = getMsjsScriptContext();

        context1.loadPackage(testScript);
        context2.loadPackage(testScript);
        final Object binding1 = context1.getBindings().get(testScript, context1.getBindings());
        assertEquals(context1, binding1);
        final Object binding2 = context2.getBindings().get(testScript, context2.getBindings());
        assertEquals(context2, binding2);
    }
    
}
