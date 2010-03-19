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

import static org.apache.commons.lang.ArrayUtils.contains;
import net.sourceforge.htmlunit.corejs.javascript.Context;

/**
 * The JavaScript object "HTMLBRElement".
 *
 * @version $Revision: 5301 $
 * @author Ahmed Ashour
 */
public class HTMLBRElement extends HTMLElement {

    private static final long serialVersionUID = -3785200238092986918L;

    /** Valid values for the {@link #jsxGet_clear() clear} property. */
    private static final String[] VALID_CLEAR_VALUES = new String[] {"left", "right", "all", "none"};

    /**
     * Creates an instance.
     */
    public HTMLBRElement() {
        // Empty.
    }

    /**
     * Returns the value of the <tt>clear</tt> property.
     * @return the value of the <tt>clear</tt> property
     */
    public String jsxGet_clear() {
        final String clear = getDomNodeOrDie().getAttribute("clear");
        if (!contains(VALID_CLEAR_VALUES, clear) && getBrowserVersion().isIE()) {
            return "";
        }
        return clear;
    }

    /**
     * Sets the value of the <tt>clear</tt> property.
     * @param clear the value of the <tt>clear</tt> property
     */
    public void jsxSet_clear(final String clear) {
        if (!contains(VALID_CLEAR_VALUES, clear) && getBrowserVersion().isIE()) {
            throw Context.reportRuntimeError("Invalid clear property value: '" + clear + "'.");
        }
        getDomNodeOrDie().setAttribute("clear", clear);
    }

}
