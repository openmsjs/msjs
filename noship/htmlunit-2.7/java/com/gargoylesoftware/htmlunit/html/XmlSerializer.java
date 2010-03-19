/*
 * Copyright (c) 2002-2010 Gargoyle Software Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.gargoylesoftware.htmlunit.html;

import java.io.File;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

import javax.imageio.ImageReader;

import org.apache.commons.io.FileUtils;
import org.apache.commons.lang.StringEscapeUtils;
import org.apache.commons.lang.StringUtils;

import com.gargoylesoftware.htmlunit.Page;
import com.gargoylesoftware.htmlunit.WebClient;

/**
 * Utility to handle conversion from HTML code to XML string.
 * @version $Revision: 5301 $
 * @author Ahmed Ashour
 */
class XmlSerializer {

    private final StringBuilder buffer_ = new StringBuilder();
    private final StringBuilder indent_ = new StringBuilder();
    private File outputDir_;
    private WebClient webClient_;

    public void save(final HtmlPage page, final File file) throws IOException {
        webClient_ = page.getWebClient();
        String fileName = file.getName();
        if (!fileName.endsWith(".htm") && !fileName.endsWith(".html")) {
            fileName += ".html";
        }
        final File outputFile = new File(file.getParentFile(), fileName);
        if (outputFile.exists()) {
            throw new IOException("File already exists: " + outputFile);
        }
        fileName = fileName.substring(0, fileName.lastIndexOf('.'));
        outputDir_ = new File(file.getParentFile(), fileName);
        FileUtils.writeStringToFile(outputFile, asXml(page.getDocumentElement()));
    }

    /**
     * Converts an HTML element to XML.
     * @param node a node
     * @return the text representation according to the setting of this serializer
     */
    public String asXml(final HtmlElement node) {
        buffer_.setLength(0);
        indent_.setLength(0);
        String charsetName = null;
        if (node.getPage() instanceof HtmlPage) {
            charsetName = node.getPage().getPageEncoding();
        }
        if (charsetName != null && node instanceof HtmlHtml) {
            buffer_.append("<?xml version=\"1.0\" encoding=\"").append(charsetName).append("\"?>").append('\n');
        }
        printXml(node);
        final String response = buffer_.toString();
        buffer_.setLength(0);
        return response;
    }

    protected void printXml(final DomElement node) {
        if (!isExcluded(node)) {
            final boolean hasChildren = node.getFirstChild() != null;
            buffer_.append(indent_).append('<');
            printOpeningTag(node);

            if (!hasChildren && !isEmptyXmlTagExpanded(node)) {
                buffer_.append("/>").append('\n');
            }
            else {
                buffer_.append(">").append('\n');
                for (DomNode child = node.getFirstChild(); child != null; child = child.getNextSibling()) {
                    indent_.append("  ");
                    if (child instanceof DomElement) {
                        printXml((DomElement) child);
                    }
                    else {
                        buffer_.append(child);
                    }
                    indent_.setLength(indent_.length() - 2);
                }
                buffer_.append(indent_).append("</").append(node.getTagName()).append('>').append('\n');
            }
        }
    }

    protected boolean isEmptyXmlTagExpanded(final DomNode node) {
        return node instanceof HtmlDivision || node instanceof HtmlInlineFrame || node instanceof HtmlOrderedList
            || node instanceof HtmlScript || node instanceof HtmlSpan || node instanceof HtmlStyle
            || node instanceof HtmlTable || node instanceof HtmlTitle || node instanceof HtmlUnorderedList;
    }

    /**
     * Prints the content between "&lt;" and "&gt;" (or "/&gt;") in the output of the tag name
     * and its attributes in XML format.
     * @param node the node whose opening tag is to be printed
     */
    protected void printOpeningTag(final DomElement node) {
        buffer_.append(node.getTagName());
        final Map<String, DomAttr> attributes;
        if (node instanceof HtmlScript) {
            attributes = getAttributesFor((HtmlScript) node);
        }
        else if (node instanceof HtmlImage) {
            attributes = getAttributesFor((HtmlImage) node);
        }
        else if (node instanceof HtmlLink) {
            attributes = getAttributesFor((HtmlLink) node);
        }
        else {
            attributes = node.getAttributesMap();
        }

        for (final String name : attributes.keySet()) {
            buffer_.append(" ");
            buffer_.append(name);
            buffer_.append("=\"");
            buffer_.append(StringEscapeUtils.escapeXml(attributes.get(name).getNodeValue()));
            buffer_.append("\"");
        }
    }

    protected Map<String, DomAttr> getAttributesFor(final HtmlScript script) {
        final Map<String, DomAttr> map = new HashMap<String, DomAttr>(script.getAttributesMap());
        final String src = map.get("src").getValue();
        try {
            final File file = createFile(src, ".js");
            final String content = webClient_.<Page>getPage(src).getWebResponse().getContentAsString();
            FileUtils.writeStringToFile(file, content);
            map.get("src").setValue(outputDir_.getName() + File.separatorChar + file.getName());
        }
        catch (final Exception e) {
            throw new RuntimeException(e);
        }
        return map;
    }

    protected Map<String, DomAttr> getAttributesFor(final HtmlLink link) {
        final Map<String, DomAttr> map = new HashMap<String, DomAttr>(link.getAttributesMap());
        final String src = map.get("href").getValue();
        try {
            final File file = createFile(src, ".css");
            FileUtils.writeStringToFile(file, link.getWebResponse(true).getContentAsString());
            map.get("href").setValue(outputDir_.getName() + File.separatorChar + file.getName());
        }
        catch (final Exception e) {
            throw new RuntimeException(e);
        }
        return map;
    }

    protected Map<String, DomAttr> getAttributesFor(final HtmlImage image) {
        final Map<String, DomAttr> map = new HashMap<String, DomAttr>(image.getAttributesMap());
        final String src = map.get("src").getValue();
        try {
            final ImageReader reader = image.getImageReader();
            final File file = createFile(src, "." + reader.getFormatName());
            image.saveAs(file);
            outputDir_.mkdirs();
            map.get("src").setValue(outputDir_.getName() + File.separatorChar + file.getName());
        }
        catch (final Exception e) {
            throw new RuntimeException(e);
        }
        return map;
    }

    protected boolean isExcluded(final DomElement element) {
        return element instanceof HtmlScript;
    }

    /**
     * Computes the best file to save the response to the given URL.
     * @param url the requested URL
     * @param extension the preferred extension
     * @return the file to create
     * @throws IOException if a problem occurs creating the file
     */
    private File createFile(final String url, final String extension) throws IOException {
        String name = url.replaceFirst("/$", "").replaceAll(".*/", "");
        name = StringUtils.substringBefore(name, "?"); // remove query
        name = StringUtils.substringBefore(name, ";"); // remove additional info
        if (!name.endsWith(extension)) {
            name += extension;
        }
        int counter = 0;
        while (true) {
            final String fileName;
            if (counter != 0) {
                fileName = StringUtils.substringBeforeLast(name, ".")
                    + "_" + counter + "." + StringUtils.substringAfterLast(name, ".");
            }
            else {
                fileName = name;
            }
            outputDir_.mkdirs();
            final File f = new File(outputDir_, fileName);
            if (f.createNewFile()) {
                return f;
            }
            counter++;
        }
    }
}
