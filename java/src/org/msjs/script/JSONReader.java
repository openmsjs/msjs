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

import org.mozilla.javascript.ScriptableObject;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.Reader;
import java.util.ArrayList;
import java.util.List;

/**
 * A JSONTokener takes a source string and extracts characters and tokens from
 * it. It is used by the JSONObject and JSONArray constructors to parse
 * JSON source strings.
 * @author JSON.org
 * @version 2008-09-18
 */
public class JSONReader {

    private int index;
    private Reader reader;
    private char lastChar;
    private boolean useLastChar;
    private final ScriptContext scriptContext;

    public JSONReader(ScriptContext scriptContext) {
        this.scriptContext = scriptContext;
    }

    public synchronized Object read(Reader reader){
        this.reader = reader.markSupported() ?
        		reader : new BufferedReader(reader);
        this.useLastChar = false;
        this.index = 0;
        return this.nextValue();
    }


    /**
     * Back up one character. This provides a sort of lookahead capability,
     * so that you can test for a digit or letter before attempting to parse
     * the next number or identifier.
     */
    private void back()  {
        if (useLastChar || index <= 0) {
            throw new RuntimeException("Stepping back two steps is not supported");
        }
        index -= 1;
        useLastChar = true;
    }



    /**
     * Get the next character in the source string.
     *
     * @return The next character, or 0 if past the end of the source string.
     */
    private char next() {
        if (this.useLastChar) {
        	this.useLastChar = false;
            if (this.lastChar != 0) {
            	this.index += 1;
            }
            return this.lastChar;
        }
        int c;
        try {
            c = this.reader.read();
        } catch (IOException exc) {
            throw new RuntimeException(exc);
        }

        if (c <= 0) { // End of stream
        	this.lastChar = 0;
            return 0;
        }
    	this.index += 1;
    	this.lastChar = (char) c;
        return this.lastChar;
    }


    /**
     * Get the next n characters.
     *
     * @param n     The number of characters to take.
     * @return      A string of n characters.
     *   Substring bounds error if there are not
     *   n characters remaining in the source string.
     */
     private String next(int n) {
         if (n == 0) {
             return "";
         }

         char[] buffer = new char[n];
         int pos = 0;

         if (this.useLastChar) {
        	 this.useLastChar = false;
             buffer[0] = this.lastChar;
             pos = 1;
         }

         try {
             int len;
             while ((pos < n) && ((len = reader.read(buffer, pos, n - pos)) != -1)) {
                 pos += len;
             }
         } catch (IOException exc) {
             throw new RuntimeException(exc);
         }
         this.index += pos;

         if (pos < n) {
             throw syntaxError("Substring bounds error");
         }

         this.lastChar = buffer[n - 1];
         return new String(buffer);
     }


    /**
     * Get the next char in the string, skipping whitespace.
     * @return  A character, or 0 if there are no more characters.
     */
    private char nextClean() {
        for (;;) {
            char c = next();
            if (c == 0 || c > ' ') {
                return c;
            }
        }
    }


    /**
     * Return the characters up to the next close quote character.
     * Backslash processing is done. The formal JSON format does not
     * allow strings in single quotes, but an implementation is allowed to
     * accept them.
     * @param quote The quoting character, either
     *      <code>"</code>&nbsp;<small>(double quote)</small> or
     *      <code>'</code>&nbsp;<small>(single quote)</small>.
     * @return      A String.
     */
    private String nextString(char quote) {
        char c;
        StringBuffer sb = new StringBuffer();
        for (;;) {
            c = next();
            switch (c) {
            case 0:
            case '\n':
            case '\r':
                throw syntaxError("Unterminated string");
            case '\\':
                c = next();
                switch (c) {
                case 'b':
                    sb.append('\b');
                    break;
                case 't':
                    sb.append('\t');
                    break;
                case 'n':
                    sb.append('\n');
                    break;
                case 'f':
                    sb.append('\f');
                    break;
                case 'r':
                    sb.append('\r');
                    break;
                case 'u':
                    sb.append((char)Integer.parseInt(next(4), 16));
                    break;
                case 'x' :
                    sb.append((char) Integer.parseInt(next(2), 16));
                    break;
                default:
                    sb.append(c);
                }
                break;
            default:
                if (c == quote) {
                    return sb.toString();
                }
                sb.append(c);
            }
        }
    }


    /**
     * Get the next value. The value can be a Boolean, Double, Integer,
     * JSONArray, JSONObject, Long, or String, or the JSONObject.NULL object.
     *
     * @return An object.
     */
    private Object nextValue() {
        char c = nextClean();
        String s;

        switch (c) {
            case '"':
            case '\'':
                return nextString(c);
            case '{':
                back();
                return makeObject();
            case '[':
            case '(': //FIXME: Really? Parens as array delimiter?
                back();
                return makeArray();
        }

        /*
         * Handle unquoted text. This could be the values true, false, or
         * null, or it can be a number. An implementation (such as this one)
         * is allowed to also accept non-standard forms.
         *
         * Accumulate characters until we reach the end of the text or a
         * formatting character.
         */

        StringBuffer sb = new StringBuffer();
        while (c >= ' ' && ",:]}/\\\"[{;=#".indexOf(c) < 0) {
            sb.append(c);
            c = next();
        }
        back();

        s = sb.toString().trim();
        if (s.equals("")) {
            throw syntaxError("Missing value");
        }
        return stringToValue(s);
    }

    private ScriptableObject makeArray() {
        return scriptContext.makeArray(makeList().toArray());
    }

    private List<Object> makeList() {
        char c = nextClean();
        char q;
        if (c == '[') {
            q = ']';
        } else if (c == '(') {
            q = ')';
        } else {
            throw syntaxError("A JSONArray text must start with '['");
        }
        List<Object> list = new ArrayList<Object>();
        if (nextClean() == ']') {
            return list;
        }
        back();
        for (;;) {
            if (nextClean() == ',') {
                back();
                list.add(null);
            } else {
                back();
                list.add(nextValue());
            }
            c = nextClean();
            switch (c) {
            case ';':
            case ',':
                if (nextClean() == ']') {
                    return list;
                }
                back();
                break;
            case ']':
            case ')':
                if (q != c) {
                    throw syntaxError("Expected a '" + q + "'");
                }
                return list;
            default:
                throw syntaxError("Expected a ',' or ']'");
            }
        }

    }

    private ScriptableObject makeObject() {
        ScriptableObject obj = scriptContext.makeObject();
        char c;
        String key;

        if (nextClean() != '{') {
            throw syntaxError("A JSONObject text must begin with '{'");
        }
        for (;;) {
            c = nextClean();
            switch (c) {
            case 0:
                throw syntaxError("A JSONObject text must end with '}'");
            case '}':
                return obj;
            default:
                back();
                key = nextValue().toString();
            }

            /*
             * The key is followed by ':'. We will also tolerate '=' or '=>'.
             */

            c = nextClean();
            if (c == '=') {
                if (next() != '>') {
                    back();
                }
            } else if (c != ':') {
                throw syntaxError("Expected a ':' after a key");
            }

            try{
                Integer intKey = Integer.parseInt(key);
                obj.put(intKey, obj, nextValue());
            }catch(Exception e){
                obj.put(key, obj, nextValue());

            }

            /*
             * Pairs are separated by ','. We will also tolerate ';'.
             */

            switch (nextClean()) {
            case ';':
            case ',':
                if (nextClean() == '}') {
                    return obj;
                }
                back();
                break;
            case '}':
                return obj;
            default:
                throw syntaxError("Expected a ',' or '}'");
            }
        }
    }

    /**
     * Make a JSONException to signal a syntax error.
     *
     * @param message The error message.
     * @return  A JSONException object, suitable for throwing
     */
    private RuntimeException syntaxError(String message) {
        return new RuntimeException(message + toString());
    }


    /**
     * Make a printable string of this JSONTokener.
     *
     * @return " at character [this.index]"
     */
    public String toString() {
        return " at character " + index;
    }

    /**
     * Try to convert a string into a number, boolean, or null. If the string
     * can't be converted, return the string.
     * @param s A String.
     * @return A simple JSON value.
     */
     private Object stringToValue(String s) {
        if (s.equals("")) {
            return s;
        }
        if (s.equalsIgnoreCase("true")) {
            return true;
        }
        if (s.equalsIgnoreCase("false")) {
            return false;
        }
        if (s.equalsIgnoreCase("null")) {
            return null;
        }

        /*
         * If it might be a number, try converting it. We support the 0- and 0x-
         * conventions. If a number cannot be produced, then the value will just
         * be a string. Note that the 0-, 0x-, plus, and implied string
         * conventions are non-standard. A JSON parser is free to accept
         * non-JSON forms as long as it accepts all correct JSON forms.
         */

        char b = s.charAt(0);
        if ((b >= '0' && b <= '9') || b == '.' || b == '-' || b == '+') {
            if (b == '0') {
                if (s.length() > 2 &&
                        (s.charAt(1) == 'x' || s.charAt(1) == 'X')) {
                    try {
                        return Integer.parseInt(s.substring(2), 16);
                    } catch (Exception e){
                        /* Ignore the error */
                    }
                } else {
                    try {
                        return Integer.parseInt(s, 8);
                    } catch (Exception e) {
                        /* Ignore the error */
                    }
                }
            }

            try {
                return new Double(s);
            }  catch (Exception g) {
                /* Ignore the error */
            }
        }
        return s;
    }

}