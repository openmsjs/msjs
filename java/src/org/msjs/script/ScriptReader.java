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

import java.io.IOException;
import java.io.Reader;

public class ScriptReader extends Reader {
    private final Reader reader;

    public static final char[] COMMENT_TERMINATOR = "/*msjs.server-only**/".toCharArray();
    private int matchPosition = 0;
    private boolean reachedTerminator = false;

    public ScriptReader(final Reader reader) {
        this.reader = reader;
    }

    @Override
    public int read(final char[] buffer, final int offset, final int length) throws IOException {
        int pos = 0;
        if (reachedTerminator) return -1;
        while (pos < length){
            int result = reader.read();

            if (result == -1){
                return pos == 0 ? -1 : pos;
            }

            char c = (char) result;
            if (c == ' ' || c == '!'){
                //no op on matcher
            }else if (COMMENT_TERMINATOR[matchPosition] == c){
                matchPosition++;
            } else {
                matchPosition = 0;
            }

            buffer[offset + pos] = c;
            pos++;

            if (matchPosition == COMMENT_TERMINATOR.length){
                reachedTerminator = true;
                return pos;
            }
        }

        return pos;
    }

    @Override
    public void close() throws IOException {
        reader.close();
    }

    @Override
    public boolean ready() throws IOException {
        return reader.ready();
    }

    @Override
    public boolean markSupported() {
        return false;
    }

    @Override
    public void reset() throws IOException {
        matchPosition = 0;
        reader.reset();
    }

}
