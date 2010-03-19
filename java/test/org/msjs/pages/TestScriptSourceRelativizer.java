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

package org.msjs.pages;

import org.jdom.Element;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.fail;
import org.junit.Test;
import org.msjs.config.MsjsConfiguration;

import java.io.FileNotFoundException;

public class TestScriptSourceRelativizer {

    private ScriptSourceRelativizer getLinkRelativizer(){
        return new ScriptSourceRelativizer();
    }

    @Test
    public void testScriptSrcRelativizer() throws FileNotFoundException {
        Element head = new Element ("head");
        Element script = new Element("script");
        head.addContent(script);
        String relSrc = "/relativeSrc";
        script.setAttribute( "src", relSrc);

        ScriptSourceRelativizer relativizer = getLinkRelativizer();
        relativizer.relativizeScriptSources(head);

        assertEquals(ScriptSourceRelativizer.CONTEXT +relSrc, script.getAttributeValue("src"));
    }

    @Test
    public void testRelativizeScriptWithNoSrc() throws FileNotFoundException {
        Element head = new Element ("head");
        Element script = new Element("script");
        head.addContent(script);
        script.addContent("a=b;");

        ScriptSourceRelativizer relativizer = getLinkRelativizer();

        //just make sure this doesn't throw a NPE
        try{
            relativizer.relativizeScriptSources(head);
        }catch (NullPointerException e){
            fail(e.getMessage());
        }
    }

    @Test
    public void testAnchorRelativizer() throws FileNotFoundException {
        Element head = new Element ("body");
        Element a = new Element("a");
        a.addContent("link text");
        head.addContent(a);
        String relSrc = "/relativeSrc";
        a.setAttribute( "href", relSrc);

        //loaded page doesn't do anything, but has to be there
        ScriptSourceRelativizer relativizer = getLinkRelativizer();
        relativizer.relativizeScriptSources(head);

        assertEquals(relSrc, a.getAttributeValue("href"));

    }

}
