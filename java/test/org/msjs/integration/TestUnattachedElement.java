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

import org.apache.log4j.Logger;
import org.junit.Test;

import java.io.IOException;

public class TestUnattachedElement extends BaseIntegrationTest{
    Logger logger = Logger.getLogger(TestUnattachedElement.class);
    /**
     * Hook for subclasses to provide the location of the page under test.
     *
     * @return The name for the page for this test
     */
    protected String getPageLocation() {
        return "/test/pages/unattachedelement";
    }

    @Test
    public void testUnattachedElement() throws IOException {
        getPage();
    }
}
