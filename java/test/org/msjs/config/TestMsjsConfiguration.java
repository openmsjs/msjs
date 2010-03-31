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

package org.msjs.config;

import static junit.framework.Assert.*;
import static junit.framework.Assert.assertNotNull;
import org.junit.Before;
import org.junit.Test;

import java.io.File;

public class TestMsjsConfiguration {
    private MsjsConfiguration config;
    
    @Before
    public void setupConfig() {
        config = BasicConfiguration.getConfiguration();
    }

    @Test
    public void testSetup() {
        assertNotNull(config);
    }

    @Test
    public void testFindDirectories() {
        String msjsRoot = config.getMsjsRoot();
        File msjsRootFile = new File(msjsRoot);
        assert(msjsRootFile.exists() );
        assert(msjsRootFile.canRead());
        assert(msjsRootFile.isDirectory());
    }


    @Test
    public void testFindTests() {
        String testScriptPath = config.getMsjsRoot() + config
                .getString("script");
        assertDirectoryExists(testScriptPath);
        assertDirectoryExists(testScriptPath + "/msjs/");
    }

    public void assertDirectoryExists(String path) {
        File file = new File(path);
        assert(file.exists() );
        assert(file.canRead());
        assert(file.isDirectory());
    }

    @Test
    public void testSystemProperty(){
        java.lang.System.setProperty("msjs.scriptRoot", "${msjs.root}/testing");
        //don't use the config that was already setup
        MsjsConfiguration withPropertyConfig = BasicConfiguration.getConfiguration();

        //check that it worked
        assertTrue(withPropertyConfig.getScriptRoot().endsWith("testing"));
        //check interpolation
        assertFalse(withPropertyConfig.getScriptRoot().contains("msjs.root"));
    }

}
