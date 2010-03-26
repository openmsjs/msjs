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

import com.gargoylesoftware.htmlunit.html.HtmlInput;
import com.gargoylesoftware.htmlunit.html.HtmlPage;
import com.gargoylesoftware.htmlunit.html.DomNode;
import org.junit.Test;

import java.io.IOException;
import java.util.List;

public class TestTutorial extends BaseIntegrationTest{

    @Override
    protected String getPageLocation() {
        return "/test/pages/tutorial";
    }

    @Test
    public void testIO() throws IOException, InterruptedException {
        HtmlPage page = getPage();
        List<HtmlInput> inputs = (List<HtmlInput>) page.getByXPath("//input");
        inputs.get(0).type("msjs");
        inputs.get(1).click();
        final DomNode span = (DomNode) page.getByXPath("//span").get(1);
        await(new TestAssertion(){
            @Override
            boolean makeAssertion() {
                return span.getTextContent().equals("509e464947b9834e3d6acd1a49754504");
            }
        });
    }
}
