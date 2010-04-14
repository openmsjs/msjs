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
import org.apache.log4j.Logger;
import org.jdom.DocType;
import org.jdom.Document;
import org.jdom.Element;
import org.mozilla.javascript.NativeArray;
import org.mozilla.javascript.NativeJavaObject;
import org.mozilla.javascript.ScriptableObject;
import org.msjs.script.MsjsScriptContext;

import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * External interface to a msjs session, used by the servlet. This is the coarse
 * unit of user-level interaction for msjs.
 */
public class Page {

    private final MsjsScriptContext context;
    private static final Logger logger = Logger.getLogger(Page.class);

    private static final Object[] EMPTY_LIST = new Object[]{};
    private long lastActiveTime;

    private static final AtomicInteger pollCount = new AtomicInteger(0);

    @Inject
    public Page(MsjsScriptContext context) {
        this.context = context;
        updateActiveTime();
    }


    public Document render(final HttpServletRequest request) {
        //careful with this order. msjs packs/unpacks info about closures
        //but graph calls msjs after the nodes are constructed and before
        //they're unpacked so that references to graph nodes are handled
        //properly
        final Object[] args = {request};
        NativeJavaObject rendering =
                (NativeJavaObject) context.callMethodOnBinding("msjs.dom", "pack", args);
        final DocType dt = new DocType("html",
                "-//W3C//DTD XHTML 1.0 Transitional//EN",
                "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd");
        updateActiveTime();
        final Document document = new Document((Element) rendering.unwrap(), dt);
        return document;
    }

    public void acceptMsj(HttpServletRequest request) {
        Object[] args = {request};
        context.callMethodOnBinding("msjs.dom", "acceptMsj", args);
        updateActiveTime();
    }


    /**
     * Calls <code>msjs.node._graph.getMsjForRemote</code>, blocking if appropriate.
     *
     * @return JSON for the outbound msj queue.
     */
    public Result getMsjForRemote() {
        pollCount.incrementAndGet();
        try {
            String result = (String) context.callMethodOnBinding("msjs.graph", "getMsjForRemoteAsJSON",
                    EMPTY_LIST);
            logger.trace("Outbound queue:" + result);
            return new Result("acceptmsj", result);
        } finally {
            pollCount.decrementAndGet();
            updateActiveTime();
        }

    }

    public Result prepareReconnect(final HttpServletRequest request) {
        Result result = new Result("reconnect", "\"" +getId() + "\"");
        updateActiveTime();
        return result;
    }

    public synchronized Cookie[] getUpdatedCookies(){
        NativeArray jsCookies = (NativeArray) context.callMethodOnBinding(
                "msjs.dom", "getUpdatedCookies", EMPTY_LIST
        );
        
        Cookie[] cookies= new Cookie[(int) jsCookies.getLength()];
        for (int i = 0; i < cookies.length; i++){
            final NativeJavaObject cookie = (NativeJavaObject) jsCookies.get(0, jsCookies);
            cookies[i] = (Cookie) cookie.unwrap();
        }
        return cookies;
    }


    /**
     * The context for scripts executed by this page.
     * This is just visible for the DotRenderer.
     *
     * @return The script context for this page.
     */
    public MsjsScriptContext getMsjsScriptContext() {
        return context;
    }

    /**
     * Shutdown the page if it's inactive
     *
     * @return true if the page was shutdown
     */
    /*package-private*/
    synchronized boolean requestShutdown() {
        boolean inactive = isInactive();
        if (inactive) shutdown();
        return inactive;
    }

    public void shutdown() {
        try {
            context.callMethodOnBinding("msjs.graph", "shutdown", EMPTY_LIST);
        } catch (Exception e) {
            logger.error("Page did not shut down cleanly", e);
        }
    }

    public String getId() {
        return context.getId();
    }

    //number of miliseconds to wait after hearing from a client page before cleaning it up
    //this should be larger than msjs.graph.MAX_LONGPOLL
    private static final long INACTIVE_WAIT_TIME = 6 * 60 * 1000; //6  minutes

    public boolean isInactive() {
        return System.currentTimeMillis() - lastActiveTime > INACTIVE_WAIT_TIME;
    }

    /*package-private*/
    synchronized void updateActiveTime() {
        lastActiveTime = System.currentTimeMillis();
    }

    public Result getErrorResponse(final Throwable e) {
        ScriptableObject obj = context.makeObject();
        obj.put("message", obj, e.getMessage());
        Object[] args = {obj};
        String errorInfo = (String) context.callMethodOnBinding("msjs", "toJSONWithFunctions", args);
        return new Result("error", errorInfo);
    }

    public static int getPollCount() {
        return pollCount.get();
    }

    public void handleWriteFailure() {
        context.callMethodOnBinding("msjs.graph", "handleWriteFailure", EMPTY_LIST);


    }
}
