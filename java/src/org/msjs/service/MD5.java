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

package org.msjs.service;

import com.google.inject.Singleton;

import java.io.UnsupportedEncodingException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

@Singleton
public final class MD5 {
    public String encrypt(final String input) {
        try{
            final byte[] bytes = input.getBytes("UTF-8");

            MessageDigest digest = MessageDigest.getInstance("MD5");
            digest.reset();
            StringBuilder result = new StringBuilder();
            for (byte b : digest.digest(bytes)){
                result.append(Integer.toHexString((b & 0xf0) >>> 4));
                result.append(Integer.toHexString(b & 0x0f));
            }

            return result.toString();
        } catch (NoSuchAlgorithmException e){
            throw new RuntimeException(e);
        } catch (UnsupportedEncodingException e){
            throw new RuntimeException(e);
        }
    }
}
