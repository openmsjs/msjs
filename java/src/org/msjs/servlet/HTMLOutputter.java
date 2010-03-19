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

import org.jdom.Document;
import org.jdom.Element;
import org.jdom.output.Format;
import org.jdom.output.XMLOutputter;

import java.io.IOException;
import java.io.Writer;
import java.util.HashSet;
import java.util.Set;

public class HTMLOutputter extends XMLOutputter {
    private final Format expandedFormat;
    private final Format unexpandedFormat;
    private static final Set<String> unexpandedElements = new HashSet<String>();
    static{
        unexpandedElements.add("input");
        unexpandedElements.add("br");
        unexpandedElements.add("meta");
        unexpandedElements.add("img");
        unexpandedElements.add("param");
        unexpandedElements.add("embed");
        unexpandedElements.add("link");
        unexpandedElements.add("hr");
    }

    public HTMLOutputter(){
        expandedFormat = Format.getRawFormat();
        expandedFormat.setExpandEmptyElements(true);
        setFormat(expandedFormat);
        unexpandedFormat = Format.getRawFormat();
        unexpandedFormat.setExpandEmptyElements(false);

        expandedFormat.setEncoding("UTF8");
        unexpandedFormat.setEncoding("UTF8");

    }

    /**
     * Override base implementation of declaration printing, because
     * IE goes into quirks mode if it gets an xml declaration
     *
     */
    @Override
    protected void printDeclaration(java.io.Writer out,
                                    Document doc,
                                    String encoding)
            throws IOException {
        //don't print the declaration to avoid IE quirks mode
    }

    @Override
    protected void printElement(final Writer writer, final Element element, final int i, final
    NamespaceStack stack) throws IOException {
        final boolean doChangeFormat = unexpandedElements.contains(element.getName());
        if (doChangeFormat){
            setFormat(unexpandedFormat);
        }
        super.printElement(writer, element, i, stack);
        if (doChangeFormat){
            setFormat(expandedFormat);
        }
    }

    @Override
    public String escapeElementEntities(final String s) {
        final String escaped = super.escapeElementEntities(s);
        StringBuilder builder = new StringBuilder();

        //escape unicode characters
        for (int i=0; i<escaped.length(); i++){
            char c = escaped.charAt(i);
            int ci = 0xffff & c;
            if (ci < 160){
                // 7 Bit
                builder.append(c);
            }else {
                // use unicode escape entity
                builder.append("&#");
                builder.append(Integer.toString(ci));
                builder.append(';');
            }
        }

        return builder.toString();
    }
}
