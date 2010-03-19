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
import com.gargoylesoftware.htmlunit.html.HtmlForm;
import com.gargoylesoftware.htmlunit.html.HtmlInput;
import com.gargoylesoftware.htmlunit.html.HtmlPage;
import static junit.framework.Assert.assertEquals;
import static junit.framework.Assert.fail;
import org.junit.Test;

import java.io.IOException;
import java.util.List;

public class TestSubmit extends BaseIntegrationTest{
    @Override
    protected String getPageLocation() {
        return "/test/pages/submit";
    }

    @Test
    public void testServerUpdate() throws IOException, InterruptedException {
        HtmlPage page = getPage();
        List<HtmlDivision> people = getPeople(page);
        assertEquals(3, people.size());
        assertPeople(people);

        List<HtmlInput> inputs = (List<HtmlInput>) page.getByXPath("//form/div/input");
        inputs.get(0).type("peter");
        inputs.get(1).type("andrea");
        //HtmlUnit doesn't properly recognize our attempt to cancel the event in the browser if
        //we click the submit button, so this does it instead
        HtmlForm form = (HtmlForm) page.getByXPath("//form").get(0);
        form.fireEvent("submit");

        long startTime = System.currentTimeMillis();
        while(people.size()<4){
            Thread.sleep(20);
            if(System.currentTimeMillis() - startTime > waitTime){
                fail("Response took too long");
            }
            people = getPeople(page);
        }

        assertEquals(4, people.size());
        assertPeople(people);
        assertEquals("peter andrea", people.get(3).getTextContent());

    }

    private List<HtmlDivision> getPeople(final HtmlPage page) {
        return (List<HtmlDivision>) page.getByXPath("//div[1]/div");
    }

    private void assertPeople(List<HtmlDivision> people){
        assertEquals("abbie guggenheim", people.get(0).getTextContent());
        assertEquals("bobby hiliard", people.get(1).getTextContent());
        assertEquals("charlie ilkilkicker", people.get(2).getTextContent());

    }
}
