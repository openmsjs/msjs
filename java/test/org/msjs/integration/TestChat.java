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
import com.gargoylesoftware.htmlunit.html.HtmlDivision;
import com.gargoylesoftware.htmlunit.html.HtmlInput;
import com.gargoylesoftware.htmlunit.html.HtmlPage;
import com.gargoylesoftware.htmlunit.html.HtmlTextArea;
import org.junit.Test;

import java.io.IOException;
import java.util.List;

public class TestChat extends BaseIntegrationTest {
    @Override
    protected String getPageLocation() {
        return "/test/pages/chat/app";
    }


    @Test
    public void testConnection() throws IOException, InterruptedException {
        final HtmlPage page = getPage();
        final HtmlPage otherPage = getPageFromNewClient();

        fillName("Alan", page);
        fillName("Bob", otherPage);

        sendMessage("Hi!", page);
        final String contents1 = "Alan: Hi!";
        assertContents(contents1, page);
        assertContents(contents1, otherPage);

        sendMessage("hola", otherPage);
        final String contents2 = "Bob: hola";
        assertContents(contents2, otherPage);
        assertContents(contents2, page);
    }

    private void assertContents(final String contents, final HtmlPage page) {
        await(new TestAssertion(){
            @Override
            boolean makeAssertion() {
                List<HtmlDivision> divs = (List<HtmlDivision>) page.getByXPath("//div");
                for (HtmlDivision div : divs){
                    if (div.getTextContent().equals(contents)) return true;
                }
                return false;
            }
        });

    }

    private void sendMessage(final String message, final HtmlPage page) throws IOException {
        HtmlTextArea textArea = (HtmlTextArea) page.getByXPath("//textarea").get(0);
        textArea.type(message);
        HtmlInput submit = (HtmlInput) page.getByXPath("//input").get(1);
        submit.click();
    }

    private void fillName(final String name, final HtmlPage page) throws IOException {
        HtmlInput input = (HtmlInput) page.getByXPath("//input").get(0);
        input.type(name);
    }

    private HtmlPage getPageFromNewClient() throws IOException {
        return (HtmlPage) getClient(BrowserVersion.FIREFOX_3).getPage(getFullUrl(getPageLocation()));

    }

}