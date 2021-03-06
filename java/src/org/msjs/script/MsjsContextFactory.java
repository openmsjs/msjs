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

import org.mozilla.javascript.Context;
import org.mozilla.javascript.ContextFactory;

/**
 * Defaults Rhino's ContextFactory's Java primitive wrap to false. This means that String, Number, Boolean and
 * Character objects are returned as JavaScript primitive types.
 */
public class MsjsContextFactory extends ContextFactory {
    @Override
    protected Context makeContext() {
        Context context = super.makeContext();
        context.getWrapFactory().setJavaPrimitiveWrap(false);
        return context;
    }
}
