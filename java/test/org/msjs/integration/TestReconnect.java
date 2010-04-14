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

import com.gargoylesoftware.htmlunit.BrowserVersion;
import com.gargoylesoftware.htmlunit.WebClient;
import com.gargoylesoftware.htmlunit.html.HtmlDivision;
import com.gargoylesoftware.htmlunit.html.HtmlInput;
import com.gargoylesoftware.htmlunit.html.HtmlPage;
import org.junit.Test;

import java.io.IOException;
import java.util.List;

public class TestReconnect extends BaseIntegrationTest {
    @Override
    protected String getPageLocation() {
        return "/test/pages/reconnect";
    }


    @Test
    public void testReconnect() throws IOException, InterruptedException {
        final HtmlPage page = getPage();
        List<HtmlInput> inputs = (List<HtmlInput>) page.getByXPath("//input");
        inputs.get(0).type("0");
        inputs.get(1).type("1");
        final HtmlDivision div = (HtmlDivision) page.getByXPath("//div").get(0);

        await(assertOutput(div, "0 | 1"));

        //now make the server graph go away
        callReload();
        //give the server time to reload
        Thread.sleep(1000);
        inputs.get(1).type("2");
        //make sure state of first input is preserved
        await(assertOutput(div, "0 | 12"));

    }

    private void callReload() throws IOException {
        WebClient client = getClient(BrowserVersion.FIREFOX_3);
        client.getPage(host + "/reload");
    }

    private TestAssertion assertOutput(final HtmlDivision div, final String content) {
        return new TestAssertion() {
            @Override
            boolean makeAssertion() {
                return div.getTextContent().equals(content);
            }
        };
    }
}