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
import static org.junit.Assert.assertTrue;
import org.junit.Test;

import java.io.IOException;

public class TestPage extends BaseIntegrationTest{
    @Override
    protected String getPageLocation() {
        return "/test/pages/page";
    }

    @Test
    public void testLocation() throws IOException {
        HtmlDivision div = (HtmlDivision) getPage().getByXPath("//div").get(0);

        assertTrue( div.getTextContent().matches("page location is.*test/pages/page.msjs.*"));

    }
}
