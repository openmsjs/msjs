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

package org.msjs.regression;

import com.gargoylesoftware.htmlunit.html.HtmlTableDataCell;
import static org.junit.Assert.assertEquals;
import org.junit.Test;
import org.msjs.integration.BaseIntegrationTest;

import java.io.IOException;
import java.util.List;

public class TestMsjs57 extends BaseIntegrationTest{
    @Override
    protected String getPageLocation() {
        return "/test/pages/regression/msjs-57";
    }

    @Test
    public void testTableContents() throws IOException {
        List<HtmlTableDataCell> td = (List<HtmlTableDataCell>) getPage().getByXPath("//td");
        assertEquals(td.get(0).getTextContent(), "one");
        assertEquals(td.get(1).getTextContent(), "two");
        assertEquals(td.get(2).getTextContent(), "three");
    }
}