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

package org.msjs.pages;

import com.google.inject.Singleton;
import org.jdom.Element;
import org.jdom.filter.Filter;

import java.util.Iterator;

@Singleton
public class ScriptSourceRelativizer {
    /*package-private*/ static final String CONTEXT = "";

    /*package-private*/ void relativizeScriptSources(final Element html) {
        Iterator children = html.getDescendants(new Filter() {
            public boolean matches(final Object o) {
                return o instanceof Element && "script".equals(((Element) o).getName());
            }
        });

        while (children.hasNext()){
            relativize((Element)children.next(), "src");
        }
    }

    private void relativize(final Element el, String attrName) {
        String val = el.getAttributeValue(attrName);
        if (val != null && val.indexOf("/") == 0){
            el.setAttribute(attrName, CONTEXT + val);
        }
    }
}