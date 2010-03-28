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

var toJSONQuoteFunctions = function(obj){
    return msjs.toJSON(obj, null, true);
};

var utf8 = "UTF-8";
var httpClient = msjs.require("org.apache.http.client.HttpClient");
var httpRequest = msjs.publish(function(converter, mimeType) {
    this.get = function(url) {
        return submit(new org.apache.http.client.methods.HttpGet(url));
    };

    // Add rev=<rev> to delete a specific revision
    this.del = function(url) {
        return submit(new org.apache.http.client.methods.HttpDelete(url));
    };

    this.post = function(url, content, mimeType) {
        return submit(new org.apache.http.client.methods.HttpPost(url), content);
    };

    this.put = function(url, content) {
        return submit(new org.apache.http.client.methods.HttpPut(url), content);
    };

    var submit = function(method, content) {
        if (content) {
            method.setEntity(new org.apache.http.entity.StringEntity(content, mimeType, utf8));
        }

        var response = httpClient.execute(method).getResponse();
        var entity = response.getEntity();
        if (entity == null) {
            throw "no entity: " + method.getURI().toString();
        }

        var inputStream = entity.getContent();
        try {
            return {
                status: response.getStatusLine().getStatusCode(),
                result: converter.convertToJS(new java.io.InputStreamReader(inputStream, utf8))
            };
        } finally {
            inputStream.close();
        }
    };
});
