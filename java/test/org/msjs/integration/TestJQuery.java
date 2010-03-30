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

import com.gargoylesoftware.htmlunit.html.HtmlDivision;
import com.gargoylesoftware.htmlunit.html.HtmlPage;
import org.junit.Test;

import java.io.IOException;

public class TestJQuery extends BaseIntegrationTest{
    @Override
    protected String getPageLocation() {
        return "/test/pages/jquery";
    }

    @Test
    public void testDocumentReady() throws IOException {
        final HtmlPage page = getPage();

        await(new TestAssertion(){

            @Override
            boolean makeAssertion() {
                HtmlDivision div = (HtmlDivision) page.getByXPath("//div").get(0);
                return div.getTextContent().equals("Got ready");
            }
        });
    }
}
