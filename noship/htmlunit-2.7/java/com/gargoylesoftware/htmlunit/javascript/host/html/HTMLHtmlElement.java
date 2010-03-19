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
 * The JavaScript object "HTMLHtmlElement".
 *
 * @version $Revision: 5301 $
 * @author Ahmed Ashour
 * @author Marc Guillemot
 */
public class HTMLHtmlElement extends HTMLElement {

    private static final long serialVersionUID = 4942983761903195465L;

    /**
     * Creates an instance.
     */
    public HTMLHtmlElement() {
        // Empty.
    }

    /**
     * Returns "clientWidth" attribute.
     * @return the clientWidth attribute
     */
    @Override
    public int jsxGet_clientWidth() {
        return getWindow().jsxGet_innerWidth();
    }

    /**
     * Returns "clientWidth" attribute.
     * @return the clientWidth attribute
     */
    @Override
    public int jsxGet_clientHeight() {
        return getWindow().jsxGet_innerHeight();
    }
}
