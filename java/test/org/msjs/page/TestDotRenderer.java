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

package org.msjs.page;

import org.junit.Assert;
import org.junit.BeforeClass;
import org.junit.Test;
import org.msjs.config.BasicConfiguration;
import org.msjs.script.ScriptContextTestProvider;

import java.io.FileNotFoundException;
import java.util.concurrent.Executors;
import java.util.regex.Pattern;

public class TestDotRenderer {
    private static PageContextProvider provider;

    @BeforeClass
    public static void setup() {
        provider = new PageContextProvider(new ScriptContextTestProvider(),
                Executors.newSingleThreadExecutor(),
                BasicConfiguration.getConfiguration());
    }


    @Test
    public void basicTest() throws FileNotFoundException {
        DotRenderer renderer = new DotRenderer(provider);
        String output = renderer.render("test/pages/tutorial");

        assertContains("\"submit#0\" -> \"#", output);
        assertContains("\"renderer#2\" -> \"#", output);//domelement
        assertContains("\"submit#0\" -> \"encrypt#1\"", output);
        assertContains("\"encrypt#1\" -> \"renderer#2\"", output);

    }

    private void assertContains(final String s, final String output) {
        String [] lines = output.split("\n");
        for (String line : lines){
            if (line.matches(".*" + Pattern.quote(s) + ".*")) return;
        }
        Assert.fail("Couldn't find " + s + " in output.");
    }

}
