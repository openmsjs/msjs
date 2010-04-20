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

package org.msjs.script;

import com.google.inject.Inject;
import com.google.inject.Singleton;
import org.apache.log4j.Logger;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.ContextFactory;
import org.mozilla.javascript.Script;
import org.msjs.config.MsjsConfiguration;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.Reader;
import java.net.URLConnection;
import java.net.URL;
import java.util.HashMap;
import java.util.Map;

/**
 * This class is responsible for finding scripts on disk, using their canonical name.
 */
@Singleton
public class ScriptLocator {
    /**
     * The location of msjs "script" directory. Specified with the
     * {@link org.msjs.config.MsjsConfiguration} "scriptRoot" property.
     */
    protected String scriptRoot;
    /**
     * The {@link org.msjs.config.MsjsConfiguration} instance used by this
     * object.
     */
    private final Logger logger = Logger.getLogger(ScriptLocator.class);
    private final ContextFactory cxFactory;
    private Map<String, Script> cache = new HashMap<String, Script>();
    private boolean doCache;
    private static final int OPTIMIZATION_LEVEL = 1;

    @Inject
    public ScriptLocator(MsjsConfiguration config, ContextFactory cxFactory) {
        assert (Context.isValidOptimizationLevel(OPTIMIZATION_LEVEL));
        this.cxFactory = cxFactory;
        reset(config);
    }

    /**
     * Gets a Reader for the the given the given package name. Future versions of
     * this class may be better suited to return {@link org.mozilla.javascript.Script}
     * instances so that scripts can be compiled and cached for performance.
     *
     * @param packageName The name of the package to locate.
     * @return A Reader which provides the script for that package.
     * @throws FileNotFoundException If the package cannot be found.
     */
    //TODO: Synchronize on the package name to allow concurrent gets
    /* package private */
    synchronized Script getScript(String packageName) throws FileNotFoundException {
        //OPTIMIZE: cache results?
        if (doCache && cache.containsKey(packageName)) {
            logger.trace("Cache hit: " + packageName);
            return cache.get(packageName);
        }

        final Script script = compileScript(packageName);
        cache.put(packageName, script);
        return script;
    }

    private Script compileScript(String packageName) throws FileNotFoundException {
        final Reader reader = getReader(packageName);
        Context cx = cxFactory.enterContext();
        cx.setOptimizationLevel(OPTIMIZATION_LEVEL);
        try {
            return cx.compileReader(reader, packageName, 1, null);
        } catch (Exception e) {
            throw new RuntimeException(e);
        } finally {
            Context.exit();
        }

    }

    public Reader getReader(final String packageName) throws FileNotFoundException {
        try {
            return getFileReader(packageName);
        } catch (FileNotFoundException e) {
            return getResourceReader(packageName);
        }
    }

    public long getLastModified(final String packageName) {
        try {
            return getResourceUrlConnection(packageName).getLastModified();
        } catch (IOException e) {
            return -1;
        }
    }

    private FileReader getFileReader(final String packageName)
            throws FileNotFoundException {
        final String slashed = packageName.replace('.', File.separatorChar).replace('/', File.separatorChar);
        final String path = scriptRoot + File.separatorChar + slashed + ".js";
        return new FileReader(new File(path));
    }

    private InputStreamReader getResourceReader(final String packageName) throws FileNotFoundException {
        try {
            URLConnection connection = getResourceUrlConnection(packageName);
            return new InputStreamReader(connection.getInputStream());
        } catch (IOException e) {
            throw new FileNotFoundException(packageName);
        }
    }

    private URLConnection getResourceUrlConnection(final String packageName) throws IOException {
        final String resource = "/" + packageName.replace('.', '/') + ".js";
        final URL url = ScriptLocator.class.getResource(resource);
        if (url == null) throw new IOException(packageName);
        return url.openConnection();
    }

    public synchronized void reset(final MsjsConfiguration config) {
        cache = new HashMap<String, Script>();
        scriptRoot = config.getScriptRoot();
    }

}