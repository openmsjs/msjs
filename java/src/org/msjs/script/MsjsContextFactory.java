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

import org.mozilla.javascript.WrapFactory;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ContextFactory;

public class MsjsContextFactory extends ContextFactory {
    //adapted from http://mxr.mozilla.org/mozilla/source/js/rhino/examples/PrimitiveWrapFactory.java
    private final WrapFactory primitiveWrapFactory = new WrapFactory() {
        @Override
        public Object wrap(final Context cx, final Scriptable scope, final Object obj,
                           final Class staticType) {
            if (obj instanceof String || obj instanceof Number || obj instanceof Boolean){
                return obj;
            }
            return super.wrap(cx, scope, obj, staticType);
        }
    };

    @Override
    protected Context makeContext() {
        Context context = super.makeContext();
        context.setWrapFactory(primitiveWrapFactory);
        return context;
    }
}
