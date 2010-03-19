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
import com.gargoylesoftware.htmlunit.html.HtmlForm;
import com.gargoylesoftware.htmlunit.html.HtmlInput;
import com.gargoylesoftware.htmlunit.html.HtmlPage;
import static junit.framework.Assert.assertEquals;
import static junit.framework.Assert.assertTrue;
import org.junit.Test;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

public class TestUpdate extends BaseIntegrationTest{
    protected String getPageLocation() {
        return "/test/pages/update";
    }

    @Test
    public void testUpdate() throws IOException, InterruptedException {
        HtmlPage page = getPage();
        doUpdateTest(page);

    }

    @Test
    public void testUpdateIE() throws IOException, InterruptedException {
        doUpdateTest(getPage(BrowserVersion.INTERNET_EXPLORER_7));
    }

    private void doUpdateTest(final HtmlPage page) throws IOException, InterruptedException {
        final List<HtmlInput> inputs = (List<HtmlInput>) page.getByXPath("//input");
        HtmlInput shorter = inputs.get(1);

        //make sure we have the right buttons
        assertEquals("shorter", shorter.getValueAttribute());

        List<HtmlDivision> animals = (List<HtmlDivision>) page.getByXPath("//div/div");
        assertEquals(5, animals.size());

        shorter.click();

        //list shouldn't have updated yet
        animals = (List<HtmlDivision>) page.getByXPath("//div/div");
        assertEquals(5, animals.size());

        final HtmlForm form = (HtmlForm) page.getByXPath("//form").get(0);
        form.fireEvent("submit");
        animals = (List<HtmlDivision>) page.getByXPath("//div/div");

        List<Double> positions = new ArrayList<Double>();
        for (HtmlDivision animal : animals){
            positions.add(getPxPosition(getStyleAttribute(animal, "top")));
        }

        Thread.sleep(600);//wait for animation to finish
        HtmlDivision firstAnimal = null;
        for (int i = 0; i < animals.size(); i++){
              HtmlDivision animal = animals.get(i);
            final Double pos = getPxPosition(getStyleAttribute(animal, "top"));
            assertTrue(positions.get(i) != pos);
            if (pos==0) firstAnimal = animal;
        }

        //first animal should be polar bear
        assertEquals("polar bear", firstAnimal.getTextContent().trim());

        //now go longer, and friendliness sort
        inputs.get(0).click();
        inputs.get(3).click();
        form.fireEvent("submit");
        animals = (List<HtmlDivision>) page.getByXPath("//div/div");
        assertEquals(5, animals.size());
        for (int i = 0; i < animals.size(); i++){
            HtmlDivision animal = animals.get(i);
            final Double pos = getPxPosition(getStyleAttribute(animal, "top"));
            positions.add(i, pos);
        }

        Thread.sleep(600);//wait for animation to finish
        animals = (List<HtmlDivision>) page.getByXPath("//div/div");
        for (int i = 0; i < animals.size(); i++){
            HtmlDivision animal = animals.get(i);
            final Double pos = getPxPosition(getStyleAttribute(animal, "top"));
            assertTrue(positions.get(i) != pos);
            if (pos==0) firstAnimal = animal;
        }

        //puppy is most friendly
        assertEquals("puppy", firstAnimal.getTextContent().trim());
    }
}
