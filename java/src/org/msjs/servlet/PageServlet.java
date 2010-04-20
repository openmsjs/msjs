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
import org.jdom.Document;
import org.jdom.output.Format;
import org.msjs.page.Page;
import org.msjs.page.Pages;
import org.msjs.page.Result;

import javax.servlet.ServletConfig;
import javax.servlet.ServletContext;
import javax.servlet.ServletException;
import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.PrintWriter;

/**
 * Servlet used to provide msjs pages (via GET), and AJAX support (via POST)
 */
public class PageServlet extends HttpServlet {
    private final Logger logger = Logger.getLogger(PageServlet.class);
    private Pages pages;

    /**
     * {@inheritDoc}
     * @param config
     * @throws ServletException
     */
    @Override
    public void init(ServletConfig config) throws ServletException {
        super.init();
        ServletContext context = config.getServletContext();
        Injector injector = (Injector) context.getAttribute(ServletListener.INJECTOR);
        pages = injector.getInstance(Pages.class);
    }

    public void destroy(){
        pages.clear();
    }

    /**
     * Page requests from the client are made using GET. The request string that
     * follows the servlet context is used as the page script to load. The
     * {@link Page} that is loaded by this request is kept in session. The response
     * to this request is returned with Content-Type "text/html" because of various
     * browser problems with "xml/html" and "text/xhtml". Furthermore, the XML declaration
     * printing is suppressed, due to problems with IE 6.
     */
    @Override
    public void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException {
        response.setCharacterEncoding("UTF8");
        try{
            long t = System.currentTimeMillis();

            final String scriptPath = getScriptLocation(request);
            logger.trace("doGet " + scriptPath);
            Page page = pages.getNew(scriptPath, isCacheAllowed(request));
            Document rendering = page.render(request);

            //would rather set content type to xhtml, but this is the best
            //solution for now, given browser situation


            response.setHeader("Content-Type", "text/html");
            response.setHeader("Cache-Control", "private, no-store, no-cache, must-revalidate");
            response.setHeader("Pragma", "no-cache");
            response.setHeader("Expires", "0");
            for (Cookie cookie : page.getUpdatedCookies()){
                response.addCookie(cookie);
            }

            returnDocument(response, rendering);
            logger.debug("Response time: " + (System.currentTimeMillis() -t ));
        } catch (Exception e){
            Throwable cause = getRootCause(e);
            if (cause instanceof RedirectException) {
                doRedirect(response, ((RedirectException)cause).getUrl());
            } else {
                logger.error("Error", e);
                throw new ServletException(e);
            }
        }
    }

    private boolean isCacheAllowed(final HttpServletRequest request) {
        return request.getParameter("nocache") == null;
    }

    private void doRedirect(HttpServletResponse response, String url) {
        response.setStatus(307);
        response.setHeader("Location", url);
        logger.trace("Redirect to " + url);
    }


    private String getScriptLocation(final HttpServletRequest request) {
        return request.getServletPath().substring(1).replaceFirst("\\.msjs$", "");
    }

    /**
     * AJAX requests from the client are made using POST. If the page request
     * location does not match the in-session {@link org.msjs.page.Page}, then this request
     * results in error. Otherwise, messages for the page are pulled from the
     * POSTed 'q' parameter and passed to {@link org.msjs.page.Page#acceptMsj}. Responses
     * for the client and then retrieved from the result of the method call and
     * passed as the body of the response.
     */
    @Override
    protected void doPost(HttpServletRequest request,
                          HttpServletResponse response)
            throws ServletException, IOException {
        Page page = null;
        Result result;

        // Set conent type header before writing to stream
        response.setCharacterEncoding("UTF-8");
        response.setHeader("Content-Type", "text/xml");

        final PrintWriter writer = response.getWriter();
        writer.append("<response>");

        try{
            //TODO: If you add a bad "id" paramter to the query string of your POST request,
            //you can mess up msjs pretty badly, since that overrides the POSTed id
            String id = request.getParameter("id");
            if (id == null) {
                logger.warn("Missing ID!");
            } else {
                page = pages.get(id);
            }

            if (page == null){
                page = pages.getReconnectedPage(id, getScriptLocation(request), isCacheAllowed(request));
                logger.trace("Reconnnect graph " + id + " to new graph " + page.getId());
                result = page.prepareReconnect(request);
            } else {
                page.acceptMsj(request);
                //Send the headers to acknowledge receipt before starting (potential) long poll
                response.flushBuffer();
                //this blocks, waiting for the request to have data or be supplanted by
                //a new request
                result = page.getMsjForRemote();
            }
        } catch (Exception e){
            result = extractRedirect(e);
            if (result == null){
                logger.error("Response error", e);

                if (page != null){
                    result = page.getErrorResponse(getRootCause(e));
                } else {
                    //this is bad
                    logger.error("Missing page; no way to handle", e);
                }
            }

        }

        if (result == null) result = new Result("error",  "\"Internal error\"");

        //if we want to be fancy, we could see if we're asking the client
        //to call us back. if we aren't, we could send a Connection: close
        //header
        try{
            Document responseDoc = result.asDocument();
            if (logger.isTraceEnabled()){
                HTMLOutputter debugXmlOutputter = new HTMLOutputter();
                debugXmlOutputter.setFormat(Format.getPrettyFormat());
                logger.trace(debugXmlOutputter.outputString(responseDoc));
            }
            returnDocument(response, responseDoc);
            writer.append("</response>");
            //Flush the buffer to generate an IOException if the connection closed
            response.flushBuffer();
        } catch (IOException e){
            page.handleWriteFailure();
        } catch (Exception e){
            logger.warn("Response failed:", e);
            throw new RuntimeException(e);
        }

    }

    private Throwable getRootCause(Exception e){
        Throwable t = e;
        while(t.getCause() != null){
            t = t.getCause();
        }
        return t;
    }

    private void returnDocument(final HttpServletResponse response, final Document output)
            throws IOException {
        new HTMLOutputter().output(output, response.getWriter());
    }

    private Result extractRedirect(Throwable e) {
        if (e instanceof RedirectException){
            RedirectException redirect = (RedirectException) e;
            return new Result("redirect", '"' + redirect.getUrl() + '"');
        }
        return null;
    }

}
