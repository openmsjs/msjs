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
package com.gargoylesoftware.htmlunit.javascript.host;

/**
 * A JavaScript object for DocumentFragment.
 *
 * @version $Revision: 5301 $
 * @author Ahmed Ashour
 *
 * @see <a href="http://www.w3.org/TR/2000/WD-DOM-Level-1-20000929/level-one-core.html#ID-B63ED1A3">
 * W3C Dom Level 1</a>
 */
public class DocumentFragment extends Node {

    private static final long serialVersionUID = -9081976556072827541L;

    /**
     * {@inheritDoc}
     */
    @Override
    public Object jsxGet_xml() {
        final Node node = jsxGet_firstChild();
        if (node != null) {
            return node.jsxGet_xml();
        }
        return "";
    }
}
