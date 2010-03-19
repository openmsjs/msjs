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

import com.google.inject.Inject;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.ContextFactory;
import org.mozilla.javascript.Script;

import java.io.Reader;

public class ScriptCompiler {
    private final ContextFactory cxFactory;

    @Inject
    public ScriptCompiler(ContextFactory cxFactory){
        this.cxFactory = cxFactory;
    }

    public Script compile(Reader reader){
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
