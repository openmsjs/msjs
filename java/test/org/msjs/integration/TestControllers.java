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

package org.msjs.integration;

import com.gargoylesoftware.htmlunit.html.HtmlButton;
import com.gargoylesoftware.htmlunit.html.HtmlElement;
import com.gargoylesoftware.htmlunit.html.HtmlPage;
import static junit.framework.Assert.assertEquals;
import org.junit.Test;
import org.w3c.dom.NodeList;

import java.io.IOException;

public class TestControllers extends BaseIntegrationTest {
    protected String getPageLocation() {
        return "/test/pages/controllers";
    }

    @Test
    public void testControllerAction() throws IOException {
        final HtmlPage page = getPage();
        assertOutput(page, "[no message]");

        NodeList buttons = page.getElementsByTagName("button");
        HtmlButton button1 = (HtmlButton) buttons.item(0);
        button1.click();

        assertOutput(page, "one");

        //Make sure that button 1 doesn't hold on to its last msj
        HtmlButton button2 = (HtmlButton) buttons.item(1);
        button2.click();
        assertOutput(page, "two");

        //Just to be sure
        button1.click();
        assertOutput(page, "one");
    }

    private void assertOutput(HtmlPage page, String output) {
        //need to re-getScript the element here, since it gets replaced when the view
        //re-renders
        HtmlElement out = (HtmlElement) page.getElementsByTagName("p").item(0);
        assertEquals(output, out.getTextContent());

    }

}
