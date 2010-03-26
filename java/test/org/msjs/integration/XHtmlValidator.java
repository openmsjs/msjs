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

package org.msjs.integration;

import org.apache.log4j.Logger;
import org.msjs.config.MsjsConfiguration;
import org.msjs.config.BasicConfiguration;
import org.w3c.dom.Document;
import org.xml.sax.EntityResolver;
import org.xml.sax.ErrorHandler;
import org.xml.sax.InputSource;
import org.xml.sax.SAXException;
import org.xml.sax.SAXParseException;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;

/**
 * Uses standard java foo to parse and validate an input stream. Uses an
 * EntityResolver that searches in the library for a local version of the
 * referenced DTD entity, and returns it if found. This greatly speeds up
 * integration tests.
 */
public class XHtmlValidator {
    private static Logger logger = Logger.getLogger(XHtmlValidator.class);
    private final EntityResolver resolver = new LocalResolver();

    /**
     * Determines whether the given input is a valid XHTML document.
     * Prints any errors and warnings to standard out.
     * @param is The InputStream to validate
     * @return "true" if the document is valid, otherwise false.
     */
    public boolean isValid(InputStream is) {
        boolean success = true;
        try{
            DocumentBuilderFactory f = DocumentBuilderFactory.newInstance();
            f.setValidating(true); // Default is false
            DocumentBuilder b = f.newDocumentBuilder();
            b.setEntityResolver(resolver);

            ErrorHandler h = new MyErrorHandler();
            b.setErrorHandler(h);
            Document d = b.parse(is);
            //document is unused; parsing is what catches errors
        } catch (Exception e){
            success = false;
        }
        return success;
    }

    private static class LocalResolver implements EntityResolver {
        private MsjsConfiguration config = BasicConfiguration.getConfiguration();

        public InputSource resolveEntity(final String publicId, final String systemId)
                throws SAXException, IOException {
            logger.trace("Seek entity: " + systemId);
            String[] pathParts = systemId.split("/");
            String fileName = pathParts[pathParts.length - 1];
            File f = new File(config.getMsjsRoot() + "/noship/" + fileName);
            if (f.exists()){
                try{
                    logger.trace("Found entity: " + f);
                    return new InputSource(new FileInputStream(f));
                } catch (Exception e){
                    logger.warn("Couldn't use local entity: " + f);
                }
            }
            logger.warn("Couldn't find local entity: " + f);
            return null;
        }
    }

    private static class MyErrorHandler implements ErrorHandler {
        public void warning(SAXParseException e) throws SAXException {
            System.out.println("Warning: ");
            printInfo(e);
        }

        public void error(SAXParseException e) throws SAXException {
            System.out.println("Error: ");
            printInfo(e);
        }

        public void fatalError(SAXParseException e) throws SAXException {
            System.out.println("Fatal error: ");
            printInfo(e);
        }

        private void printInfo(SAXParseException e) {
            System.out.println("   Public ID: " + e.getPublicId());
            System.out.println("   System ID: " + e.getSystemId());
            System.out.println("   Line number: " + e.getLineNumber());
            System.out.println("   Column number: " + e.getColumnNumber());
            System.out.println("   Message: " + e.getMessage());
            throw new RuntimeException(e);
        }
    }
}
