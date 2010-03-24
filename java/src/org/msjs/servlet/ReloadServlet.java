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
import org.msjs.config.MsjsConfiguration;
import org.msjs.pages.Pages;
import org.msjs.script.MsjsScriptContext;
import org.msjs.script.ScriptLocator;

import javax.servlet.ServletConfig;
import javax.servlet.ServletContext;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

public class ReloadServlet extends HttpServlet {
    private ScriptLocator locator;
    private Pages pages;
    private MsjsConfiguration msjsConfig;

    @Override
    public void init(ServletConfig config) throws ServletException {
        super.init();
        ServletContext context = config.getServletContext();

        Injector injector = (Injector) context.getAttribute(ServletListener.INJECTOR);

        locator = injector.getInstance(ScriptLocator.class);
        pages = injector.getInstance(Pages.class);
        msjsConfig = injector.getInstance(MsjsConfiguration.class);
    }

    @Override
    public void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException {
        response.setHeader("Content-Type", "text/html");
        try{
            msjsConfig.reset();
            locator.reset(msjsConfig);
            MsjsScriptContext.clearSingletonScope();
            pages.clear();
            response.getOutputStream().print("Reloaded");
            msjsConfig.log();
        } catch (IOException e){
            throw new RuntimeException(e);
        }

    }

}
