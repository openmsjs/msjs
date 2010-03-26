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

package org.msjs.page;

import com.google.inject.Inject;
import com.google.inject.Singleton;
import org.apache.log4j.Logger;

import java.io.FileNotFoundException;
import java.util.Map;
import java.util.Timer;
import java.util.TimerTask;
import java.util.concurrent.ConcurrentHashMap;

@Singleton
public class Pages {
    private final Map<String, Page> map = new ConcurrentHashMap<String, Page>();
    private static final long REAPER_INTERVAL = 1 * 60 * 1000;//1 minute

    private static final Logger logger = Logger.getLogger(Pages.class);
    private final PageContextProvider contextProvider;


    @Inject
    public Pages(final PageContextProvider contextProvider, final Timer timer) {
        this.contextProvider = contextProvider;

        final TimerTask reaper = new TimerTask() {
            @Override
            public void run() {
                for (Page page : map.values()) {
                    if (page.isInactive()) {
                        //shutdown catches exceptions, so no need for try
                        if (page.requestShutdown()) {
                            logger.trace("Expiring page: " + page.getId());
                            removePage(page);
                        }
                    }

                }
            }
        };
        timer.schedule(reaper, REAPER_INTERVAL, REAPER_INTERVAL);
        logger.info("Page reaper started with interval of " + REAPER_INTERVAL);
    }

    private void removePage(final Page page) {
        map.remove(page.getId());
    }

    public Page getNew(final String scriptPath, final boolean allowCache) throws FileNotFoundException {
        Page newPage = new Page(contextProvider.get(scriptPath, allowCache));
        map.put(newPage.getId(), newPage);
        return newPage;
    }

    public Page get(String id) {
        Page page = map.get(id);
        if (page != null) page.updateActiveTime();
        return page;
    }

    public synchronized void clear() {
        for (Page page : map.values()) {
            page.shutdown();
            removePage(page);
        }
    }

    public int count() {
        return map.values().size();
    }

}
