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

package org.msjs.servlet;

import com.google.inject.Injector;
import org.apache.log4j.Logger;
import org.msjs.config.MsjsConfiguration;

import javax.servlet.ServletConfig;
import javax.servlet.ServletContext;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.FileNotFoundException;

public abstract class ResourceServlet extends HttpServlet {
    private final Logger logger = Logger.getLogger(ResourceServlet.class);

    private static final int TWO_WEEKS = 2 * 7 * 24 * 60 * 60 * 1000;
    private boolean doCache = false;

    @Override
    public void init(ServletConfig config) throws ServletException {
        super.init();
        ServletContext servletContext = config.getServletContext();
        Injector injector = (Injector) servletContext.getAttribute(ServletListener.INJECTOR);
        doCache = injector.getInstance(MsjsConfiguration.class).getBoolean("doCache");
    }

    @Override
    protected void doGet(HttpServletRequest request,
                         HttpServletResponse response)
            throws ServletException, IOException {
        logger.trace("Resource request:" + request.getPathInfo());
        try {
            handleRequest(request, response);
            if (doCache) {
                // Add date header only if request was successfully handled
                response.setDateHeader("Expires", System.currentTimeMillis() + TWO_WEEKS);
            }
        } catch (Exception e) {
            logger.error("Error fetching resource: " + request.getRequestURI());
            logger.error("Exception message: " + e.getMessage());
            if (e instanceof FileNotFoundException) {
                response.setStatus(HttpServletResponse.SC_NOT_FOUND);
            } else {
                response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            }
        }
    }

    protected abstract void handleRequest(final HttpServletRequest request,
                                          final HttpServletResponse response) throws IOException;
}
