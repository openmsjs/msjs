/*
 * Copyright (c) 2002-2010 Gargoyle Software Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.gargoylesoftware.htmlunit;

import java.io.IOException;
import java.net.URL;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;

import com.gargoylesoftware.htmlunit.util.NameValuePair;

/**
 * A fake {@link WebConnection} designed to mock out the actual HTTP connections.
 *
 * @version $Revision: 5357 $
 * @author <a href="mailto:mbowler@GargoyleSoftware.com">Mike Bowler</a>
 * @author Noboru Sinohara
 * @author Marc Guillemot
 * @author Brad Clarke
 * @author Ahmed Ashour
 */
public class MockWebConnection implements WebConnection {

    private static final Log LOG = LogFactory.getLog(MockWebConnection.class);

    private final Map<String, WebResponseData> responseMap_ = new HashMap<String, WebResponseData>(10);
    private WebResponseData defaultResponse_;
    private WebRequestSettings lastRequest_;
    private int requestCount_ = 0;
    private final List<URL> requestedUrls_ = Collections.synchronizedList(new ArrayList<URL>());

    /**
     * {@inheritDoc}
     */
    public WebResponse getResponse(final WebRequestSettings settings) throws IOException {
        final URL url = settings.getUrl();

        LOG.debug("Getting response for " + url.toExternalForm());

        lastRequest_ = settings;
        requestCount_++;
        requestedUrls_.add(url);

        WebResponseData response = responseMap_.get(url.toExternalForm());
        if (response == null) {
            response = defaultResponse_;
            if (response == null) {
                throw new IllegalStateException("No response specified that can handle URL ["
                    + url.toExternalForm()
                    + "]");
            }
        }

        return new WebResponseImpl(response, settings, 0);
    }

    /**
     * Gets the list of requested URLs relative to the provided URL.
     * @param relativeTo what should be removed from the requested URLs.
     * @return the list of relative URLs
     */
    public List<String> getRequestedUrls(final URL relativeTo) {
        final String baseUrl = relativeTo.toString();
        final List<String> response = new ArrayList<String>();
        for (final URL url : requestedUrls_) {
            String s = url.toString();
            if (s.startsWith(baseUrl)) {
                s = s.substring(baseUrl.length());
            }
            response.add(s);
        }

        return response;
    }

    /**
     * Returns the method that was used in the last call to submitRequest().
     *
     * @return the method that was used in the last call to submitRequest()
     */
    public HttpMethod getLastMethod() {
        return lastRequest_.getHttpMethod();
    }

    /**
     * Returns the parameters that were used in the last call to submitRequest().
     *
     * @return the parameters that were used in the last call to submitRequest()
     */
    public List<NameValuePair> getLastParameters() {
        return lastRequest_.getRequestParameters();
    }

    /**
     * Sets the response that will be returned when the specified URL is requested.
     * @param url the URL that will return the given response
     * @param content the content to return
     * @param statusCode the status code to return
     * @param statusMessage the status message to return
     * @param contentType the content type to return
     * @param responseHeaders the response headers to return
     */
    public void setResponse(final URL url, final String content, final int statusCode,
            final String statusMessage, final String contentType,
            final List< ? extends NameValuePair> responseHeaders) {

        setResponse(
                url,
                TextUtil.stringToByteArray(content),
                statusCode,
                statusMessage,
                contentType,
                responseHeaders);
    }

    /**
     * Sets the response that will be returned when the specified URL is requested.
     * @param url the URL that will return the given response
     * @param content the content to return
     * @param statusCode the status code to return
     * @param statusMessage the status message to return
     * @param contentType the content type to return
     * @param charset the name of a supported charset
     * @param responseHeaders the response headers to return
     */
    public void setResponse(final URL url, final String content, final int statusCode,
            final String statusMessage, final String contentType, final String charset,
            final List< ? extends NameValuePair> responseHeaders) {

        setResponse(
                url,
                TextUtil.stringToByteArray(content, charset),
                statusCode,
                statusMessage,
                contentType,
                responseHeaders);
    }

    /**
     * Sets the response that will be returned when the specified URL is requested.
     * @param url the URL that will return the given response
     * @param content the content to return
     * @param statusCode the status code to return
     * @param statusMessage the status message to return
     * @param contentType the content type to return
     * @param responseHeaders the response headers to return
     */
    public void setResponse(final URL url, final byte[] content, final int statusCode,
            final String statusMessage, final String contentType,
            final List< ? extends NameValuePair> responseHeaders) {

        final List<NameValuePair> compiledHeaders = new ArrayList<NameValuePair>(responseHeaders);
        if (contentType != null) {
            compiledHeaders.add(new NameValuePair("Content-Type", contentType));
        }
        final WebResponseData responseEntry = new WebResponseData(content, statusCode, statusMessage, compiledHeaders);
        responseMap_.put(url.toExternalForm(), responseEntry);
    }

    /**
     * Convenient method that is the same as calling
     * {@link #setResponse(URL,String,int,String,String,List)} with a status
     * of "200 OK", a content type of "text/html" and no additional headers.
     *
     * @param url the URL that will return the given response
     * @param content the content to return
     */
    public void setResponse(final URL url, final String content) {
        final List< ? extends NameValuePair> emptyList = Collections.emptyList();
        setResponse(url, content, 200, "OK", "text/html", emptyList);
    }

    /**
     * Convenient method that is the same as calling
     * {@link #setResponse(URL,String,int,String,String,List)} with a status
     * of "200 OK" and no additional headers.
     *
     * @param url the URL that will return the given response
     * @param content the content to return
     * @param contentType the content type to return
     */
    public void setResponse(final URL url, final String content, final String contentType) {
        final List< ? extends NameValuePair> emptyList = Collections.emptyList();
        setResponse(url, content, 200, "OK", contentType, emptyList);
    }

    /**
     * Convenient method that is the same as calling
     * {@link #setResponse(URL,String,int,String,String,String,List)} with a status
     * of "200 OK" and no additional headers.
     *
     * @param url the URL that will return the given response
     * @param content the content to return
     * @param contentType the content type to return
     * @param charset the name of a supported charset
     */
    public void setResponse(final URL url, final String content, final String contentType, final String charset) {
        final List< ? extends NameValuePair> emptyList = Collections.emptyList();
        setResponse(url, content, 200, "OK", contentType, charset, emptyList);
    }

    /**
     * Specify a generic HTML page that will be returned when the given URL is specified.
     * The page will contain only minimal HTML to satisfy the HTML parser but will contain
     * the specified title so that tests can check for titleText.
     *
     * @param url the URL that will return the given response
     * @param title the title of the page
     */
    public void setResponseAsGenericHtml(final URL url, final String title) {
        final String content = "<html><head><title>" + title + "</title></head><body></body></html>";
        setResponse(url, content);
    }

    /**
     * Sets the response that will be returned when a URL is requested that does
     * not have a specific content set for it.
     *
     * @param content the content to return
     * @param statusCode the status code to return
     * @param statusMessage the status message to return
     * @param contentType the content type to return
     */
    public void setDefaultResponse(final String content, final int statusCode,
            final String statusMessage, final String contentType) {

        setDefaultResponse(TextUtil.stringToByteArray(content), statusCode, statusMessage, contentType);
    }

    /**
     * Sets the response that will be returned when a URL is requested that does
     * not have a specific content set for it.
     *
     * @param content the content to return
     * @param statusCode the status code to return
     * @param statusMessage the status message to return
     * @param contentType the content type to return
     */
    public void setDefaultResponse(final byte[] content, final int statusCode,
            final String statusMessage, final String contentType) {

        final List<NameValuePair> compiledHeaders = new ArrayList<NameValuePair>();
        compiledHeaders.add(new NameValuePair("Content-Type", contentType));
        final WebResponseData responseEntry = new WebResponseData(content, statusCode, statusMessage, compiledHeaders);
        defaultResponse_ = responseEntry;
    }

    /**
     * Sets the response that will be returned when a URL is requested that does
     * not have a specific content set for it.
     *
     * @param content the content to return
     */
    public void setDefaultResponse(final String content) {
        setDefaultResponse(content, 200, "OK", "text/html");
    }

    /**
     * Sets the response that will be returned when a URL is requested that does
     * not have a specific content set for it.
     *
     * @param content the content to return
     * @param contentType the content type to return
     */
    public void setDefaultResponse(final String content, final String contentType) {
        final List< ? extends NameValuePair> emptyList = Collections.emptyList();
        setDefaultResponse(content, 200, "OK", contentType, emptyList);
    }

    /**
     * Sets the response that will be returned when a URL is requested that does
     * not have a specific content set for it.
     *
     * @param content the content to return
     * @param contentType the content type to return
     * @param charset the name of a supported charset
     */
    public void setDefaultResponse(final String content, final String contentType, final String charset) {
        final List< ? extends NameValuePair> emptyList = Collections.emptyList();
        setDefaultResponse(content, 200, "OK", contentType, charset, emptyList);
    }

    /**
     * Sets the response that will be returned when the specified URL is requested.
     * @param content the content to return
     * @param statusCode the status code to return
     * @param statusMessage the status message to return
     * @param contentType the content type to return
     * @param responseHeaders the response headers to return
     */
    public void setDefaultResponse(final String content, final int statusCode,
            final String statusMessage, final String contentType,
            final List< ? extends NameValuePair> responseHeaders) {

        final List<NameValuePair> compiledHeaders = new ArrayList<NameValuePair>(responseHeaders);
        compiledHeaders.add(new NameValuePair("Content-Type", contentType));
        defaultResponse_ = new WebResponseData(TextUtil.stringToByteArray(content),
            statusCode, statusMessage, compiledHeaders);
    }

    /**
     * Sets the response that will be returned when the specified URL is requested.
     * @param content the content to return
     * @param statusCode the status code to return
     * @param statusMessage the status message to return
     * @param contentType the content type to return
     * @param charset the name of a supported charset
     * @param responseHeaders the response headers to return
     */
    public void setDefaultResponse(final String content, final int statusCode,
            final String statusMessage, final String contentType, final String charset,
            final List< ? extends NameValuePair> responseHeaders) {

        final List<NameValuePair> compiledHeaders = new ArrayList<NameValuePair>(responseHeaders);
        compiledHeaders.add(new NameValuePair("Content-Type", contentType));
        defaultResponse_ = new WebResponseData(TextUtil.stringToByteArray(content, charset),
            statusCode, statusMessage, compiledHeaders);
    }

    /**
     * Returns the additional headers that were used in the in the last call
     * to {@link #getResponse(WebRequestSettings)}.
     * @return the additional headers that were used in the in the last call
     *         to {@link #getResponse(WebRequestSettings)}
     */
    public Map<String, String> getLastAdditionalHeaders() {
        return lastRequest_.getAdditionalHeaders();
    }

    /**
     * Returns the {@link WebRequestSettings} that was used in the in the last call
     * to {@link #getResponse(WebRequestSettings)}.
     * @return the {@link WebRequestSettings} that was used in the in the last call
     *         to {@link #getResponse(WebRequestSettings)}
     */
    public WebRequestSettings getLastWebRequestSettings() {
        return lastRequest_;
    }

    /**
     * Returns the number of requests made to this mock web connection.
     * @return the number of requests made to this mock web connection
     */
    public int getRequestCount() {
        return requestCount_;
    }

    /**
     * Indicates if a response has already been configured for this URL.
     * @param url the url
     * @return <code>false</code> if no response has been configured
     */
    public boolean hasResponse(final URL url) {
        return responseMap_.containsKey(url.toExternalForm());
    }
}
