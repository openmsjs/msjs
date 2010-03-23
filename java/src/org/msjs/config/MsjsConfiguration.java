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

package org.msjs.config;

import com.google.inject.Singleton;
import org.apache.commons.configuration.PropertiesConfiguration;
import org.apache.log4j.LogManager;
import org.apache.log4j.Logger;
import org.apache.log4j.PropertyConfigurator;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileReader;
import java.util.Iterator;
import java.util.Properties;

/**
 * Provides configuration values to classes within msjs. Configurations are loaded
 * out of two files: <code>msjs.config.xml</code> and (optionally)
 * <code>local.config.xml</code> These files are expected to be in a directory named
 * <code>lib/config</code> below the msjs root directory. The format of a config file is as
 * follows:
 * <pre>&lt;configurations&gt;
 * &lt;configuration name="default"&gt;
 * &lt;cheese&gt;cheddar&lt;/cheese&gt;
 * &lt;beverage&gt;beer&lt;/beverage&gt;
 * &lt;/configuration&gt;
 * &lt;configuration name="test"&gt;
 * &lt;depends&gt;default&lt;/depends&gt;
 * &lt;cheese&gt;provolone&lt;/cheese&gt;
 * &lt;meal&gt;Hamburger with ${cheese} and a ${beverage}&lt;/meal&gt;
 * &lt;/configuration&gt;
 * &lt;/configurations&gt;</pre>
 * <p/>
 * In this example, a MsjsConfiguration class loaded with the config named "test"
 * would have these values:
 * <pre> cheese: provolone
 * beverage: beer
 * meal : Hamburger with provolone and a beer</pre> Multiple <code>&lt;depends&gt;</code>
 * statements are allowed. They are processed in order; last one wins. Any property in any
 * named config may be specified in the local config file, including new configs that aren't
 * referenced in the main config file. Note, however, that the build system <em>ignores</em>
 * local config. For more about Configuration and variable interpolation, see the docs for
 * {@link org.apache.commons.configuration.Configuration}
 */
@Singleton
public class MsjsConfiguration extends PropertiesConfiguration {

    private static final Logger logger = Logger.getLogger(MsjsConfiguration.class);

    private static final String WEBAPP_PATH = "msjs.webappPath";

    private static final String MSJS_CONFIG = "msjs.properties";
    private static final String LOCAL_CONFIG = "msjs-local.properties";

    private static final String MSJS_ROOT = "msjs.root";
    private static final String SCRIPT_ROOT = "msjs.scriptRoot";
    private static final String FILE_ROOT = "msjs.fileRoot";
    private static final String DO_CACHE = "msjs.doCache";

    private static final String LOG4J_PROPERTY = "log4j.appender.msjs.File";

    private final String configDir;
    private final String defaultMsjsRoot;
    private final String webappPath;
    private final Properties log4jProperties = new Properties();
    private File localConfig;
    private File msjsConfig;

    /**
     * @param configDir       The directory where configuration exists.
     * @param defaultMsjsRoot The default directory for msjs.
     */
    public MsjsConfiguration(final String configDir, final String defaultMsjsRoot) {
        this(configDir, defaultMsjsRoot, null);
    }

    public MsjsConfiguration(final String configDir, final String defaultMsjsRoot, final String webappPath) {
        this.configDir = configDir;
        this.defaultMsjsRoot = defaultMsjsRoot;
        this.webappPath = webappPath;
        reset();
    }


    public void reset() {
        clear();

        msjsConfig = new File(configDir + "/" + MSJS_CONFIG);
        localConfig = new File(configDir + "/" + LOCAL_CONFIG);

        loadConfig(msjsConfig);
        if (localConfig.exists()) loadConfig(localConfig);


        String msjsRoot = getString(MSJS_ROOT);
        if (isEmpty(msjsRoot)) {
            msjsRoot = defaultMsjsRoot;
            if (isEmpty(msjsRoot)) {
                msjsRoot = System.getProperty(MSJS_ROOT);
            }
        }

        if (isEmpty(msjsRoot)) {
            throw new RuntimeException(MSJS_ROOT + " is undefined");
        }


        // log4j.properties can use system variables
        System.setProperty(MSJS_ROOT, msjsRoot);
        setProperty(MSJS_ROOT, msjsRoot);

        if (webappPath != null) {
            setProperty(WEBAPP_PATH, webappPath);
        }

        configureLogger();
    }

    public void log() {
        logger.info("==== CONFIG ====");
        logger.info("Loaded " + msjsConfig);
        if (localConfig.exists()) logger.info("Loaded " + localConfig);
        if (webappPath != null) {
            logger.info(WEBAPP_PATH + ": " + webappPath);
        }
        logger.info(MSJS_ROOT + ": " + getMsjsRoot());
        logger.info(SCRIPT_ROOT + ": " + getScriptRoot());
        logger.info(FILE_ROOT + ": " + getFileRoot());
        logger.info(DO_CACHE + ": " + getString(DO_CACHE));
        logger.info(LOG4J_PROPERTY + ": " + getString(LOG4J_PROPERTY));
        if (logger.isDebugEnabled()) {
            Iterator<String> iter = getKeys();
            while (iter.hasNext()) {
                String key = iter.next();
                if (key.equals(WEBAPP_PATH) || key.equals(MSJS_ROOT) || key.equals(SCRIPT_ROOT) ||
                        key.equals(FILE_ROOT)) continue;
                logger.debug(key + ": " + getString(key));
            }
        }
    }

    public String getMsjsRoot() {
        return getString(MSJS_ROOT);
    }

    public String getScriptRoot() {
        return getString(SCRIPT_ROOT);
    }

    public String getFileRoot() {
        return getString(FILE_ROOT);
    }

    public String getWebappPath() {
        return getString(WEBAPP_PATH);
    }

    private void loadConfig(File config) {
        try {
            load(new FileReader(config));
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    private void configureLogger() {
        log4jProperties.clear();

        try {
            log4jProperties.load(new FileInputStream(msjsConfig));
            if (localConfig.exists()) {
                final FileInputStream inputStream = new FileInputStream(localConfig);
                log4jProperties.load(inputStream);
                inputStream.close();
            }
        } catch (Exception e) {
            logger.error("Could not load log4j config");
            throw new RuntimeException(e);
        }

        LogManager.resetConfiguration();
        PropertyConfigurator.configure(log4jProperties);
    }

    private boolean isEmpty(String str) {
        return str == null || str.length() == 0;
    }

}
