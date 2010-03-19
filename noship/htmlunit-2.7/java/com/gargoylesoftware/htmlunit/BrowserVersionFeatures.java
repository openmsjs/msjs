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
package com.gargoylesoftware.htmlunit;

/**
 * Constants of various features of each {@link BrowserVersion}.
 *
 * @version $Revision: 5301 $
 * @author Ahmed Ashour
 * @author Marc Guillemot
 * @author Sudhan Moghe
 */
public enum BrowserVersionFeatures {

    /** Indicates that a blur event should be triggered before an onchange event. */
    BLUR_BEFORE_ONCHANGE,

    /** Indicates that the browser can inherit CSS property values. */
    CAN_INHERIT_CSS_PROPERTY_VALUES,

    /** Indicates that document.createEvent() initializes the target property. This is what FF2 does but not FF3. */
    CREATEEVENT_INITALIZES_TARGET,

    /** Indicates that document.execCommand() should throw an exception when called with an illegal command. */
    EXECCOMMAND_THROWS_ON_WRONG_COMMAND,

    /** */
    HTMLOPTION_PREVENT_DISABLED,

    /** Indicates that the browser should ignore contents of inner head elements. */
    IGNORE_CONTENTS_OF_INNER_HEAD,

    /** Indicates that the URL of parent window is used to resolve URLs in frames with javascript src. */
    JS_FRAME_RESOLVE_URL_WITH_PARENT_WINDOW,

    /** Indicates that a read only JS property can be... set as done by IE and FF2 but not FF3. */
    SET_READONLY_PROPERTIES,

    /**
     * Indicates that the href property for a &lt;link rel="stylesheet" type="text/css" href="..." /&gt;
     * is the fully qualified URL.
     */
    STYLESHEET_HREF_EXPANDURL,

    /** Indicates that the href property for a &lt;style type="text/css"&gt; ... &lt;/style&gt; is "". */
    STYLESHEET_HREF_STYLE_EMPTY,

    /** Indicates that the href property for a &lt;style type="text/css"&gt; ... &lt;/style&gt; is null. */
    STYLESHEET_HREF_STYLE_NULL,

    /** Indicates that "\n" are replaced by "\r\n" in textarea values. */
    TEXTAREA_CRNL,

    /** Indicates that the browser treats "position: fixed" as if it were "position: static". */
    TREATS_POSITION_FIXED_LIKE_POSITION_STATIC,

    /** Indicates that 'this' corresponds to the handler function when a XMLHttpRequest handler is executed. */
    XMLHTTPREQUEST_HANDLER_THIS_IS_FUNCTION;

}
