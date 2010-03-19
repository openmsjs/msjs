/*
 * Copyright (c) 2002-2010 Gargoyle Software Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.gargoylesoftware.htmlunit.javascript.host.html;

/**
 * The JavaScript object "HTMLMapElement".
 *
 * @version $Revision: 5301 $
 * @author Ahmed Ashour
 */
public class HTMLMapElement extends HTMLElement {

    private static final long serialVersionUID = 1163437293365889923L;

    /**
     * Creates an instance.
     */
    public HTMLMapElement() {
        // Empty.
    }

    /**
     * Returns the value of the JavaScript attribute "areas".
     * @return the value of this attribute
     */
    public HTMLCollection jsxGet_areas() {
        final HTMLCollection areas = new HTMLCollection(this);
        areas.init(getDomNodeOrDie(), "./area");
        return areas;
    }
}
