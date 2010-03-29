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
import org.msjs.page.Page;
import org.msjs.page.Pages;

import javax.servlet.ServletConfig;
import javax.servlet.ServletContext;
import javax.servlet.ServletException;
import javax.servlet.ServletOutputStream;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.InputStream;
import java.util.Enumeration;
import java.util.Properties;

/**
 * Gives status and configuration information about the running msjs
 * instance, within the servlet container.
 */
public class StatusServlet extends HttpServlet {
    private final Logger logger = Logger.getLogger(ResourceServlet.class);
    private MsjsConfiguration msjsConfig;
    private Pages pages;


    @Override
    public void init(ServletConfig config) throws ServletException {
        super.init();
        ServletContext servletContext = config.getServletContext();
        Injector injector = (Injector) servletContext.getAttribute(ServletListener.INJECTOR);
        msjsConfig = injector.getInstance(MsjsConfiguration.class);
        pages = injector.getInstance(Pages.class);
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        response.setHeader("Content-Type", "text/html");
        ServletOutputStream out = response.getOutputStream();
        try{
            out.print(formatProperty("config", msjsConfig.getString("config")));
            out.print(formatProperty("msjsRoot", msjsConfig.getMsjsRoot()));

            printProperties(out, getBuildProperties());

            printPageCache(out);

            out.print(formatProperty("open connections", Integer.toString(Page.getPollCount())));

        } catch (IOException e){
            logger.error(e);
        }
    }

    private void printProperties(final ServletOutputStream out, final Properties properties)
            throws IOException {
        Enumeration keys = properties.keys();
        while (keys.hasMoreElements()){
            final String key = (String) keys.nextElement();
            out.print(formatProperty(key, properties.getProperty(key)));
        }
    }

    private void printPageCache(ServletOutputStream out) throws IOException {
        out.print(formatProperty("Page cache size", Integer.toString(pages.count())));
    }

    private String formatProperty(String propName, String propValue) {
        return String.format(
                "<div class='property'><span class='name'>%s</span> = <span class='value'>%s</span></div>",
                propName, propValue);
    }


    private Properties getBuildProperties() {
        Properties properties = new Properties();
        try{
            InputStream str = this.getClass().getResourceAsStream("/build.properties");
            if (str != null) properties.load(str);
        } catch (Exception e){
            logger.error(e);
        }
        return properties;
    }

}
