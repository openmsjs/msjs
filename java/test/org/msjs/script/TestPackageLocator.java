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

import static junit.framework.Assert.fail;
import org.junit.Before;
import org.junit.Test;
import org.mozilla.javascript.ContextFactory;
import org.msjs.config.MsjsConfiguration;
import org.msjs.config.BasicConfiguration;

import java.io.FileNotFoundException;

public class TestPackageLocator {

    private MsjsConfiguration config;

    @Before
    public void setupConfig() {
        config = BasicConfiguration.getConfiguration();
    }
    
    @Test
    public void testFindFramework() {
        ScriptLocator locator = new ScriptLocator(config, new ContextFactory());
        try {
            locator.getScript("msjs");
        } catch (FileNotFoundException e) {
            fail("Couldn't find msjs package");
        }
    }
}
