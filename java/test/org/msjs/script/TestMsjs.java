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

public class TestMsjs extends BaseScriptTest {

    @Override
    protected String getTestDirectory() {return "/test/msjs";}

    @Test
    public void testNode() {
        runTest("testnode");
    }

    @Test
    public void testPacking() {
        runTest("testpacking");
    }

    @Test
    public void testRequires() {
        runTest("testrequires");
    }

    @Test
    public void testTransient() {
        runTest("testtransient");
    }

    @Test
    public void testStrongComponents() {
        runTest("teststrongcomponents");
    }

    @Test
    public void testJSON() {
        runTest("testjson");
    }

    @Test
    public void testInclude() {
        runTest("testinclude");
    }

    @Test
    public void testAsync() {
        runTest("testasync");
    }

    @Test
    public void testTopoSort() {
        runTest("testtoposort");
    }

    @Test
    public void testPublishTwice() {
        runTest("testpublishtwice");
    }

    @Test
    public void testFreeVariables() {
        runTest("testfreevariables");
    }

    @Test
    public void testFunctionPack() {
        runTest("testfunctionpack");
    }

    @Test
    public void testJavaWrap() {
        runTest("testjavawrap");
    }

    @Test
    public void testDeterminePack() {
        runTest("testdeterminepack");
    }

    @Test
    public void testRequireMap() {
        runTest("testrequiremultiple");
    }

}
