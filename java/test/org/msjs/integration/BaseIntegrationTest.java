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

import com.gargoylesoftware.htmlunit.BrowserVersion;
import com.gargoylesoftware.htmlunit.WebResponse;
import com.gargoylesoftware.htmlunit.html.DomNode;
import com.gargoylesoftware.htmlunit.html.HtmlPage;
import static junit.framework.Assert.assertTrue;
import static junit.framework.Assert.fail;
import org.junit.Test;

import java.io.IOException;

/**
 * Used to provide the basis for an integration test of a msjs page, using HtmlUnit.
 * By default, the page loaded by an integration test dervied from this class is
 * also validated against the XHTML strict DTD.
 */
public abstract class BaseIntegrationTest extends BaseTest {
    private static final XHtmlValidator validator = new XHtmlValidator();

    /**
     * Hook for subclasses to provide the location of the page under test.
     * @return The name for the page for this test
     */
    protected abstract String getPageLocation();

    /**
     * Tests the given page for validity against the XHTML strict DTD.
     * Fails if the document is not valid.
     * @throws IOException If the page cannot be loaded.
     */
    @Test
    public void testValidity() throws IOException {
        WebResponse response = validate(getPageLocation());
        assertTrue("Validity of " + this.getPageLocation(),
                   validator.isValid(response.getContentAsStream()));
    }

    /**
     * Returns a page retrieved with HtmlUnit's {@link com.gargoylesoftware.htmlunit.BrowserVersion#FIREFOX_2}
     * WebClient
     * @return An HtmlPage for use in tests.
     * @throws IOException If the page cannot be loaded
     */
    protected HtmlPage getPage() throws IOException {
        return getPage(BrowserVersion.FIREFOX_3);
    }

    /**
     * Returns a page retrieved with a WebClient using the given BrowserVersion.
     * @param version The version of WebClient to use to retrieve the page.
     * @return An page for use in tests.
     * @throws IOException If the page cannot be loaded.
     */
    protected HtmlPage getPage(BrowserVersion version) throws IOException {
        return getPage(version, getPageLocation());
    }

    /**
     * Waits for getTextContext() of the given node to return a string that equals
     * and expected string. This method is helpful for expressing expectations resulting
     * calls to and from the server
     * @param el The dom node whose text content to test
     * @param expected The expected text content of the node
     * @throws InterruptedException
     */
    protected void awaitText(DomNode el, final String expected){
        long startTime = System.currentTimeMillis();
        while (!el.getTextContent().equals(expected)){
            try{
                Thread.sleep(20);
            } catch (InterruptedException e){
                fail ("Testus interruptus");
            }
            if (System.currentTimeMillis() - startTime > waitTime){
                fail("Didn't find text: " + expected + " one " + el);
            }
        }
    }

}
