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
import org.msjs.script.ScriptCache;

import javax.servlet.ServletConfig;
import javax.servlet.ServletContext;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

public class CacheServlet extends ResourceServlet {
    private ScriptCache scriptCache;

    @Override
    public void init(ServletConfig config) throws ServletException {
        super.init(config);
        ServletContext servletContext = config.getServletContext();
        Injector injector = (Injector) servletContext.getAttribute(ServletListener.INJECTOR);
        scriptCache = injector.getInstance(ScriptCache.class);
    }

    @Override
    protected void handleRequest(HttpServletRequest request, HttpServletResponse response) throws IOException {
        String contentType = "text/javascript"; //just one content type for now
        response.setHeader("Content-Type", contentType);
        response.getWriter().print(scriptCache.get(getCachePath(request)));
    }

    @Override
    protected long getLastModified(HttpServletRequest request) {
        return -1;
    }

    private String getCachePath(HttpServletRequest request) {
        return request.getServletPath().substring(1).replaceFirst("\\.jc$", "");
    }

}
