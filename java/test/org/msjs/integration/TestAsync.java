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
import com.gargoylesoftware.htmlunit.html.HtmlDivision;
import com.gargoylesoftware.htmlunit.html.HtmlPage;
import static junit.framework.Assert.assertEquals;
import static junit.framework.Assert.fail;
import org.apache.log4j.Logger;
import org.junit.Test;

import java.io.IOException;
import java.util.List;

public class TestAsync extends BaseIntegrationTest {

    private static final Logger logger = Logger.getLogger(TestAsync.class);
    @Override
    protected String getPageLocation() {
        return "/test/pages/async";
    }

    @Test
    public void testAsync() throws IOException, InterruptedException {
        HtmlPage page = getPage();
        HtmlButton button = (HtmlButton) page.getByXPath("//div/button").get(0);

        String[] list1 = {};
        assertList(list1, page);
        button.click();

        String[] list2 = {"Client update 0"};
        assertList(list2, page);

        String[] list3 = {"Client update 0", "Server update 0"};
        waitForList(list3, page);

        button.click();
        Thread.sleep(20);
        button.click();
        String[] list4 = {"Client update 0", "Server update 0",
                          "Client update 1", "Client update 2"};

        assertList(list4, page);

        String[] list5 = {"Client update 0", "Server update 0",
                          "Client update 1", "Client update 2",
                          "Server update 2"};
        //Stupid htmlunit 1.7 is borked -- it only makes one xmlhttprequest at a time
        //FIXME
        //waitForList(list5, page);

    }

    private void waitForList(final String[] list, final HtmlPage page)
            throws InterruptedException {
        long startTime = System.currentTimeMillis();
        while (getOutput(page).size() != list.length){
            Thread.sleep(20);
            if (System.currentTimeMillis() - startTime > waitTime){
                fail("Response took too long");
            }
        }
        assertList(list, page);

    }

    private void assertList(final String[] list, HtmlPage page) {
        List els = getOutput(page);
        for (int i = 0; i < list.length; i++){
            HtmlDivision div = (HtmlDivision) els.get(i);

            assertEquals(list[i], div.getTextContent().trim());

        }
    }

    private List getOutput(final HtmlPage page) {
        List els = page.getByXPath("//div[2]/div");
        return els;
    }
}
