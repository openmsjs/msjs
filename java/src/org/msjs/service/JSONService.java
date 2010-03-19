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

import com.google.inject.Inject;
import com.google.inject.Singleton;
import org.apache.http.HttpEntity;
import org.apache.http.HttpResponse;
import org.apache.http.client.HttpClient;
import org.apache.http.client.methods.HttpUriRequest;
import org.apache.http.conn.ClientConnectionManager;
import org.apache.http.impl.client.DefaultHttpClient;
import org.apache.log4j.Logger;
import org.mozilla.javascript.ScriptableObject;
import org.msjs.script.JSConverter;

import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.Reader;
import java.io.IOException;

@Singleton
public class JSONService {
    private static final Logger logger = Logger.getLogger(JSONService.class);

    private final JSConverter jsConverter;
    final HttpClient httpClient;
    private long calls = 0;
    private long avgResponseTime = 0;

    public String getProfileInfo() {
        return "JSONService calls:" + calls + " Avg:" + avgResponseTime + "ms";
    }

    private final Converter DEFAULT_CONVERTER = new Converter() {
        @Override
        public Object convert(Reader reader) throws Exception {
            return jsConverter.fromJSON(reader);
        }
    };

    @Inject
    public JSONService(final JSConverter jsConverter, final ClientConnectionManager manager) {
        this.jsConverter = jsConverter;
        httpClient = new DefaultHttpClient(manager);
    }

    public ScriptableObject get(final HttpUriRequest method, final Converter converter) {
        InputStream inputStream = null;
        try {
            long t = System.currentTimeMillis();
            HttpResponse response = httpClient.execute(method);
            long time = System.currentTimeMillis() - t;
            avgResponseTime = (calls * avgResponseTime + time) / (calls + 1);
            ++calls;

            HttpEntity entity = response.getEntity();
            if (entity == null) {
                logger.error("no entity " + method.getURI().toString());
                throw new RuntimeException("no entity: " + method.getURI().toString());
            }
            inputStream = entity.getContent();
            Object result = converter.convert(new InputStreamReader(inputStream, "UTF8"));
            ScriptableObject wrap = jsConverter.makeObject();
            wrap.put("status", wrap, response.getStatusLine().getStatusCode());
            wrap.put("result", wrap, result);
            return wrap;
        } catch (Exception e) {
            logger.error(e.getMessage() + " " + method.getURI().toString());
            throw new RuntimeException(e);
        } finally {
            close(inputStream);
        }
    }

    private void close(InputStream inputStream) {
        try {
            if (inputStream != null) inputStream.close();
        } catch (IOException e) {
            //ignore
        }
    }

    public ScriptableObject get(final HttpUriRequest method) {
        return get(method, DEFAULT_CONVERTER);
    }
}