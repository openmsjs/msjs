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
import com.google.inject.Singleton;
import org.mozilla.javascript.ScriptableObject;

import java.io.IOException;
import java.io.Reader;
import java.util.ArrayList;
import java.util.List;
/**
 * Provides services that bridge Rhino and JavaScript types. For now,
 * its only function is to convert msjs JSON-style XML nodes to JDOM XML.
 */
@Singleton
public class JSConverter {

    private final MsjsScriptContext context;

    /**
     * Constructs a new JSConverter. This class is immutable, so it is thread safe.
     * @param context The context which is used for executing JavaScript helper
     * methods.
     */
    @Inject
    public JSConverter(MsjsScriptContext context){
        this.context = context;
    }

    public Object fromJSON(Reader reader) throws IOException {
        return (new JSONReader(context)).read(reader);
    }

    public List toList(final ScriptableObject o) {
        final List<Object> list = new ArrayList<Object>();
        Double length = (Double) ScriptableObject.getProperty(o, "length");
        if (length != null){
            for (int i = 0; i < length; i++){
                final Object val = o.get(i, o);
                list.add(i, val);
            }
        }
        return list;
    }

    public ScriptableObject makeObject() {
        return context.makeObject();
    }

    public ScriptableObject makeArray(Object[] elements){
        return context.makeArray(elements);
    }
    

}
