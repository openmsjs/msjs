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

var utf8 = "UTF-8";
var httpClient = msjs.require("java.org.apache.http.client.HttpClient");

/**
    Prototype to make HTTP requests with. For example, to create an instance to
    handle JSON requests:
    @example
    new msjs.require("msjs.httprequest")(jsonConverter, "application/json")    

    @namespace Prototype to make HTTP requests with.
    @param {org.msjs.service.Converter} converter Converts an HTTP response into
    a JavaScript object.
    @param {String} defaultMimeType The default mime type for POST and PUT
    requests. This can be overridden when making the request.
    @name msjs.httprequest
*/
var httpRequest = msjs.publish(function(converter, defaultMimeType) {
    /**
        Make a GET method HTTP call.
        @param {String} url Fully qualified URL.
        @return {Object} an object containing a status code and a result value like
        {status: <status>, result: <result>}.
        @name get
        @methodOf msjs.httprequest#
    */
    this.get = function(url) {
        return submit(new org.apache.http.client.methods.HttpGet(url));
    };

    /**
        Make a DELETE method HTTP call.
        @param {String} url Fully qualified URL.
        @return {Object} an object containing a status code and a result value like
        {status: <status>, result: <result>}.
        @name del
        @methodOf msjs.httprequest#
    */
    this.del = function(url) {
        return submit(new org.apache.http.client.methods.HttpDelete(url));
    };

    /**
        Make a POST method HTTP call.
        @param {String} url Fully qualified URL.
        @param {String} content The content of the request. Uses UTF-8 encoding.
        @param {String} mimeType (optional) The mime type of the
        content. Default is the mime type of the instance.
        @return {Object} an object containing a status code and a result value like
        {status: <status>, result: <result>}.
        @name post
        @methodOf msjs.httprequest#
    */
    this.post = function(url, content, mimeType) {
        return submitEntity(new org.apache.http.client.methods.HttpPost(url), content, mimeType);
    };

    /**
        Make a PUT method HTTP call.
        @param {String} url Fully qualified URL.
        @param {String} content The content of the request. Uses UTF-8 encoding.
        @param {String} mimeType (optional) The mime type of the
        content. Default is the mime type of the instance.
        @return {Object} an object containing a status code and a result value like
        {status: <status>, result: <result>}.
        @name put
        @methodOf msjs.httprequest#
    */
    this.put = function(url, content, mimeType) {
        return submitEntity(new org.apache.http.client.methods.HttpPut(url), content, mimeType);
    };

    var submitEntity = function(method, content, mimeType) {
        method.setEntity(new org.apache.http.entity.StringEntity(content, mimeType || defaultMimeType, utf8));
        return submit(method);
    };

    var submit = function(method) {
        var response = httpClient.execute(method);
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
