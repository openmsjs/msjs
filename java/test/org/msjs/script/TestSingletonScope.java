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
import org.junit.Test;

import java.util.concurrent.Callable;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

public class TestSingletonScope {
    private final ScriptContextTestProvider provider = new ScriptContextTestProvider();
    private MsjsScriptContext getMsjsScriptContext() {
        return provider.get();
    }

    @Test
    public void testScopes() throws InterruptedException, ExecutionException {
        final String testScript = "test.singleton";
        ExecutorService service = Executors.newCachedThreadPool();
        Object [] arg = { testScript };
        Future<Object> future1 = service.submit( getCallable(getMsjsScriptContext(), arg));
        Future<Object> future2 = service.submit( getCallable(getMsjsScriptContext(), arg));
        Object published = getMsjsScriptContext().callMethod("msjs", "require", arg);

        assertEquals(published, future1.get());
        assertEquals(published, future2.get());
    }

    private Callable<Object> getCallable(final MsjsScriptContext context, final Object[] arg) {
        return new Callable<Object>() {
            @Override
            public Object call() throws Exception {
                //Thread.sleep(1000);
                return context.callMethod("msjs", "require", arg);
            }
        };
    }


}
