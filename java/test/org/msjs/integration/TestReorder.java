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
import com.gargoylesoftware.htmlunit.html.HtmlInput;
import com.gargoylesoftware.htmlunit.html.HtmlPage;
import static junit.framework.Assert.assertTrue;
import org.junit.Test;

import java.io.IOException;
import java.util.List;

public class TestReorder extends BaseIntegrationTest{
    @Override
    protected String getPageLocation() {
        return "/test/pages/reorder";
    }

    @Test
    public void testReorder() throws IOException {
        HtmlPage page = getPage();

        List<HtmlDivision> divs = (List<HtmlDivision>) page.getByXPath("//div/div");

        String prev = null;
        //assert it's order by first
        for (HtmlDivision div : divs){
            if (prev != null){
                assertTrue(div.getTextContent().compareTo(prev) < 0 );
            }
        }
        HtmlInput button = (HtmlInput) page.getByXPath("//div/input").get(0);
        button.click();        
        prev = null;
        //assert it's order by last
        for (HtmlDivision div : divs){
            if (prev != null){
                String name = div.getTextContent();
                name = name.split(" ")[1];
                assertTrue(name.compareTo(prev) < 0 );
            }
        }
    }
}
