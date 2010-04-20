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

package org.msjs.script;

import org.junit.Test;

public class TestMsjsConnection extends BaseScriptTest{

    @Override
    protected String getTestDirectory() {return "/test/msjs/connection";}

    @Test
    public void testUpdateGraph() {
        runTest("testupdategraph");
    }

    @Test
    public void testAcceptUpdates() {
        runTest("testacceptupdates");
    }

    @Test
    public void testSendUpdates() {
        runTest("testsendupdates");
    }
}
