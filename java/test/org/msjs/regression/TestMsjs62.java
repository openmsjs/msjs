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

import org.junit.Test;
import org.msjs.page.BaseDotRendererTest;
import org.msjs.page.DotRenderer;

import java.io.FileNotFoundException;

public class TestMsjs62 extends BaseDotRendererTest {
    @Test
    public void testRendering() throws FileNotFoundException {
        DotRenderer renderer = new DotRenderer(provider);
        String output = renderer.render("test/pages/regression/msjs-62");
        //Make sure a dom element connects to the picker
        assertContains("\"picker#2\" ->", output);

    }


}