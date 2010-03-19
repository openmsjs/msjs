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

import java.io.Serializable;
import java.net.URL;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.Set;

import org.apache.commons.httpclient.HttpState;
import org.apache.commons.httpclient.cookie.CookiePolicy;
import org.apache.commons.httpclient.cookie.CookieSpec;
import org.apache.commons.lang.StringUtils;

import com.gargoylesoftware.htmlunit.util.Cookie;

/**
 * Manages cookies for a {@link WebClient}. This class is thread-safe.
 *
 * @version $Revision: 5301 $
 * @author Daniel Gredler
 * @author Ahmed Ashour
 */
public class CookieManager implements Serializable {

    /** Serial version UID. */
    private static final long serialVersionUID = 4145377365165079425L;

    /**
     * HtmlUnit's cookie policy is to be browser-compatible. Code which requires access to
     * HtmlUnit's cookie policy should use this constant, rather than making assumptions and using
     * one of the HttpClient {@link CookiePolicy} constants directly.
     */
    public static final String HTMLUNIT_COOKIE_POLICY = CookiePolicy.BROWSER_COMPATIBILITY;

    /** Whether or not cookies are enabled. */
    private boolean cookiesEnabled_;

    /** The cookies added to this cookie manager. */
    private final Set<Cookie> cookies_;

    /**
     * Creates a new instance.
     */
    public CookieManager() {
        cookiesEnabled_ = true;
        cookies_ = new LinkedHashSet<Cookie>();
    }

    /**
     * Enables/disables cookie support. Cookies are enabled by default.
     * @param enabled <tt>true</tt> to enable cookie support, <tt>false</tt> otherwise
     */
    public synchronized void setCookiesEnabled(final boolean enabled) {
        cookiesEnabled_ = enabled;
    }

    /**
     * Returns <tt>true</tt> if cookies are enabled. Cookies are enabled by default.
     * @return <tt>true</tt> if cookies are enabled, <tt>false</tt> otherwise
     */
    public synchronized boolean isCookiesEnabled() {
        return cookiesEnabled_;
    }

    /**
     * Returns the currently configured cookies, in an unmodifiable set.
     * @return the currently configured cookies, in an unmodifiable set
     */
    public synchronized Set<Cookie> getCookies() {
        return Collections.unmodifiableSet(cookies_);
    }

    /**
     * Returns the currently configured cookies applicable to the specified URL, in an unmodifiable set.
     * @param url the URL on which to filter the returned cookies
     * @return the currently configured cookies applicable to the specified URL, in an unmodifiable set
     */
    public synchronized Set<Cookie> getCookies(final URL url) {
        final String host = url.getHost();
        final String path = url.getPath();
        final boolean secure = "https".equals(url.getProtocol());

        final int port;
        if (url.getPort() != -1) {
            port = url.getPort();
        }
        else {
            port = url.getDefaultPort();
        }

        final CookieSpec spec = CookiePolicy.getCookieSpec(HTMLUNIT_COOKIE_POLICY);
        final org.apache.commons.httpclient.Cookie[] all = Cookie.toHttpClient(cookies_);
        final org.apache.commons.httpclient.Cookie[] matches = spec.match(host, port, path, secure, all);

        final Set<Cookie> cookies = new LinkedHashSet<Cookie>();
        cookies.addAll(Cookie.fromHttpClient(matches));
        return Collections.unmodifiableSet(cookies);
    }

    /**
     * Returns the currently configured cookie with the specified name, or <tt>null</tt> if one does not exist.
     * @param name the name of the cookie to return
     * @return the currently configured cookie with the specified name, or <tt>null</tt> if one does not exist
     */
    public synchronized Cookie getCookie(final String name) {
        for (Cookie cookie : cookies_) {
            if (StringUtils.equals(cookie.getName(), name)) {
                return cookie;
            }
        }
        return null;
    }

    /**
     * Adds the specified cookie.
     * @param cookie the cookie to add
     */
    public synchronized void addCookie(final Cookie cookie) {
        cookies_.remove(cookie);
        cookies_.add(cookie);
    }

    /**
     * Removes the specified cookie.
     * @param cookie the cookie to remove
     */
    public synchronized void removeCookie(final Cookie cookie) {
        cookies_.remove(cookie);
    }

    /**
     * Removes all cookies.
     */
    public synchronized void clearCookies() {
        cookies_.clear();
    }

    /**
     * Updates the specified HTTP state's cookie configuration according to the current cookie settings.
     * @param state the HTTP state to update
     * @see #updateFromState(HttpState)
     */
    protected synchronized void updateState(final HttpState state) {
        if (!cookiesEnabled_) {
            return;
        }
        state.clearCookies();
        for (Cookie cookie : cookies_) {
            state.addCookie(cookie.toHttpClient());
        }
    }

    /**
     * Updates the current cookie settings from the specified HTTP state's cookie configuration.
     * @param state the HTTP state to update from
     * @see #updateState(HttpState)
     */
    protected synchronized void updateFromState(final HttpState state) {
        if (!cookiesEnabled_) {
            return;
        }
        cookies_.clear();
        cookies_.addAll(Cookie.fromHttpClient(state.getCookies()));
    }

}
