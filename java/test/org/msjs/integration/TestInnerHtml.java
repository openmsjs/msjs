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

import com.gargoylesoftware.htmlunit.html.HtmlAnchor;
import com.gargoylesoftware.htmlunit.html.HtmlDivision;
import com.gargoylesoftware.htmlunit.html.HtmlPage;
import static junit.framework.Assert.assertEquals;
import org.junit.Test;

import java.io.IOException;

public class TestInnerHtml extends BaseIntegrationTest {
    protected String getPageLocation() {
        return "/test/pages/innerhtml";
    }


    @Test
    public void doTest() throws IOException {
        final HtmlPage page = getPage();
        HtmlDivision div = (HtmlDivision) page.getBody().getFirstChild();
        assertEquals("foo foo foo", div.getTextContent());

        HtmlAnchor a = (HtmlAnchor) page.getBody().getFirstChild().getNextSibling();
        assertEquals("link to google", a.getTextContent());
        assertEquals("http://google.com", a.getAttribute("href"));

        //should be request iframe
        assertEquals("iframe", a.getNextSibling().getLocalName());

    }
}
