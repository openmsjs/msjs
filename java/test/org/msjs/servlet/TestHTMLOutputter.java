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

package org.msjs.servlet;

import org.jdom.Element;
import org.junit.Test;
import static org.junit.Assert.*;


public class TestHTMLOutputter {

    @Test
    public void testEntityEscaping(){
        final String inText = "This is \u201Ctext\u201D";

        Element e = new Element("div");
        e.addContent(inText);

        HTMLOutputter out = new HTMLOutputter();

        final String output = out.outputString(e);

        assertEquals(output, "<div>This is &#8220;text&#8221;</div>");


    }
}
