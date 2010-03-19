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

import com.google.inject.Guice;
import com.google.inject.Injector;
import com.google.inject.Module;
import com.google.inject.servlet.ServletModule;
import org.apache.log4j.Logger;
import org.msjs.config.MsjsConfiguration;
import org.msjs.config.MsjsModule;

import javax.servlet.ServletContext;
import javax.servlet.ServletContextEvent;
import javax.servlet.ServletContextListener;
import java.util.ArrayList;
import java.util.List;

/**
 * Class is used to bootstrap the {@link Injector} so that every servlet
 * in the container can share it. It stores the injector in the {@link ServletContext}
 * under the key {@link ServletListener#INJECTOR}. When this class
 * creates the {@link org.msjs.config.MsjsModule} used by the injector, it attempts to
 * read the {@link ServletListener#CONFIG_NAME} Servlet Context
 * Parameter. See Tomcat docs for ways to set this parameter. Finally, when it loads,
 * this class sets the system property named {@link MsjsConfiguration#MSJS_ROOT}
 * to the {@link ServletContext#getRealPath} of the Servlet. This class is automatically
 * constructed and called by the container.
 */
public class ServletListener implements ServletContextListener {
    private MsjsModule msjsModule;

    private static final Logger logger = Logger.getLogger(ServletListener.class);

    /**
     * The name of the key used to store the injector in the {@link ServletContext}.
     * Individual Servlets can retrieve the injector under this key at
     * {@link javax.servlet.http.HttpServlet#init} time.
     */
    public static final String INJECTOR = Injector.class.getName();
    /**
     * The context parameter that this class looks for in the
     * {@link ServletContext} to use as the config name.
     */
    public static final String CONFIG_NAME = "MSJS_CONFIG";

    /**
     * Creates the injector and stores it in the {@link ServletContext}.
     */
    @Override
    public void contextInitialized(ServletContextEvent servletContextEvent) {
        try {
            ServletContext context = servletContextEvent.getServletContext();
            String defaultMsjsRoot = getRealPath(context);

            String configDir = defaultMsjsRoot + "/WEB-INF";
            MsjsConfiguration config = new MsjsConfiguration(configDir, defaultMsjsRoot);

            String contextPath = context.getContextPath();
            String webappPath = config.getWebappPath();
            if (!contextPath.equals(webappPath)) {
                logger.warn("Mismatch! Servlet context path: \"" + contextPath +"\", config webapp path: \"" + webappPath+ "\"");
                logger.warn("Setting config webapp path to \"" + contextPath + "\"");
                config.setWebappPath(contextPath);
            }

            context.setAttribute(INJECTOR, getInjector(config));
            config.log();
        } catch (Exception e) {
            logger.error("Fatal startup error", e);
            System.err.println("Fatal startup error: " + e);
            System.exit(1);
        }
    }

    private String getRealPath(ServletContext context) {
        String path = context.getRealPath("/");
        if (path.endsWith("/")) {
            path = path.substring(0, path.length() - 1);
        }
        return path;
    }

    /**
     * Removes the injector from the {@link ServletContext}.
     */

    @Override    
    public void contextDestroyed(ServletContextEvent servletContextEvent) {
        msjsModule.shutdown();
    }

    private Injector getInjector(MsjsConfiguration config) {
        List<Module> moduleList = new ArrayList<Module>();
        moduleList.add(new ServletModule());
        msjsModule = new MsjsModule(config);
        moduleList.add(msjsModule);
        return Guice.createInjector(moduleList);
    }
}