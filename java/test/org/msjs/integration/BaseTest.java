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

import com.gargoylesoftware.htmlunit.AlertHandler;
import com.gargoylesoftware.htmlunit.BrowserVersion;
import com.gargoylesoftware.htmlunit.DefaultCredentialsProvider;
import com.gargoylesoftware.htmlunit.IncorrectnessListenerImpl;
import com.gargoylesoftware.htmlunit.Page;
import com.gargoylesoftware.htmlunit.WebClient;
import com.gargoylesoftware.htmlunit.WebRequestSettings;
import com.gargoylesoftware.htmlunit.WebResponse;
import com.gargoylesoftware.htmlunit.html.HtmlElement;
import com.gargoylesoftware.htmlunit.html.HtmlPage;
import static junit.framework.Assert.assertEquals;
import org.apache.log4j.Logger;
import org.junit.BeforeClass;
import org.msjs.config.MsjsConfiguration;
import org.msjs.config.BasicConfiguration;

import java.io.IOException;
import java.net.URL;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public abstract class BaseTest {
    protected static MsjsConfiguration config;
    private static final Logger logger = Logger.getLogger(BaseTest.class);

    private static String host;
    protected static long waitTime;

    @BeforeClass
    public static void setup() {
        config = BasicConfiguration.getConfiguration();
        host = config.getString("msjs.testHost", "http://localhost:8080/msjs");
        waitTime = config.getLong("msjs.testWaitTime", 10000);
    }

    protected WebResponse validate(final String pageUrl) throws IOException {
        URL url = new URL(getFullUrl(pageUrl));
        WebClient client = getClient(BrowserVersion.getDefault());
        WebRequestSettings settings = new WebRequestSettings(url);
        WebResponse response = client.loadWebResponse(settings);
        assertEquals("Success status code expected", 200, response.getStatusCode());
        return response;
    }

    /**
     * Gets the full URL of the page under test, using the configuration properties
     * "host", and {@link BaseIntegrationTest#getPageLocation}
     *
     * @param url Relative URL after host, port and servlet context path.
     * @return The full URL of the page for this test
     */
    protected String getFullUrl(String url) {
        return host + url + ".msjs?nocache";
    }


    /**
     * Gets a web client, registered with the default credential set for the msjs
     * servlet container.
     *
     * @param version The browser version to use for the web client
     * @return WebClient for use in tests
     */
    protected WebClient getClient(BrowserVersion version) {
        DefaultCredentialsProvider credentials = new DefaultCredentialsProvider();
        credentials.addCredentials("demonstration", "highlands");
        final WebClient webClient = new WebClient(version);
        webClient.setCredentialsProvider(credentials);

        //allow logging via alert()
        webClient.setAlertHandler(new AlertHandler() {
            @Override
            public void handleAlert(final Page page, final String s) {
                logger.info("ALERT: " + s);
            }
        });
        webClient.setIncorrectnessListener(new IncorrectnessListenerImpl() {
            @Override
            public void notify(final String s, final Object o) {
                if (s.equals("Obsolete content type encountered: 'text/javascript'.")) return;
                super.notify(s, o);
            }
        });

        return webClient;
    }

    /**
     * Returns a page retrieved with a WebClient using the given BrowserVersion.
     *
     * @param location The location of the page to retrieve.
     * @return An page for use in tests.
     * @throws java.io.IOException If the page cannot be loaded.
     */
    protected HtmlPage getPage(String location) throws IOException {
        return getPage(BrowserVersion.FIREFOX_3, location);
    }

    /**
     * Returns a page retrieved with a WebClient using the given BrowserVersion.
     *
     * @param version  The version of WebClient to use to retrieve the page.
     * @param location The location of the page to retrieve.
     * @return An page for use in tests.
     * @throws java.io.IOException If the page cannot be loaded.
     */
    protected HtmlPage getPage(BrowserVersion version, String location) throws IOException {
        return (HtmlPage) getClient(version).getPage(getFullUrl(location));
    }

    /**
     * Gets the value of the given style attribute by parsing the element's "style"
     * property. Returns null if the attribute is not found.
     *
     * @param element The element on which to look for the style attribute
     * @param attr    The name of the style attribute to retrieve
     * @return The string value of the given style attribute.
     */
    protected String getStyleAttribute(final HtmlElement element, final String attr) {
        String style = element.getAttribute("style");
        Pattern p = Pattern.compile(".*" + attr + ".*?:(.+?);.*");
        Matcher m = p.matcher(style);

        if (m.matches()) return m.group(1).trim();

        return null;
    }

    /**
     * Helper method for use with style attributes that are specified in pixels, such
     * as "height" and "border-width". Strips trailing "px" from the string and then
     * parses the result as a Double. Throws {@link NumberFormatException} exception if
     * the string cannot be converted to a Double.
     *
     * @param s The string to parse
     * @return The Double value of the string.
     */
    protected Double getPxPosition(final String s) {
        String trimmed = s.substring(0, s.lastIndexOf("px"));
        return Double.parseDouble(trimmed);
    }

    /**
     * Sends and ASCII key code to the focussed element. This is similar to HtmlUnit's
     * {@link com.gargoylesoftware.htmlunit.html.HtmlElement#type} method, but allows for direct sending of key codes, in order
     * to simulate the arrow keys and backspace buttons, for example.
     *
     * @param input The input element to which to send the key
     * @param c     The code of the key to send
     */
    protected void sendKeyCode(final HtmlElement input, final int c) throws InterruptedException {
        sendKeyCode(input, c, 0);
    }

    /**
     * See also: {@link org.msjs.integration.BaseIntegrationTest#sendKeyCode(com.gargoylesoftware.htmlunit.html.HtmlElement, int)}. This method allows test
     * to simulate a held key, waiting for the given number of milliseconds before sending
     * the {@link com.gargoylesoftware.htmlunit.javascript.host.Event#TYPE_KEY_UP} event.
     * Note that this method does not send multiple keypress events, regardless of the sleep
     * time.
     *
     * @param input The element to which to send the key code
     * @param c     The key code to send
     * @param sleep Number of milliseconds to simulate holding the key
     * @throws InterruptedException If the Thread is sleeping when it is asked to stop.
     */
    protected void sendKeyCode(final HtmlElement input, final int c, int sleep)
            throws InterruptedException {
        try {
            input.type((char) c);
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }
}
