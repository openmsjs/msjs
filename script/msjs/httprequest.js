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

var httpService = msjs.require("java.org.msjs.service.HttpService");
var httpRequest = msjs.publish(function(converter) {

    this.get = function(url) {
        return submitRequest(
            new org.apache.http.client.methods.HttpGet(url)
        );
    };

    // Add rev=<rev> to delete a specific revision
    this.del = function(url) {
        return submitRequest(
            new org.apache.http.client.methods.HttpDelete(url)
        );
    };

    this.post = function(url, resource) {
        return submitResource(
            new org.apache.http.client.methods.HttpPost(url),
            resource
        );
    };

    this.put = function(url, resource) {
        return submitResource(
            new org.apache.http.client.methods.HttpPut(url), 
            resource
        );
    };

    var submitRequest = function(method) {
        return httpService.get(method, converter);
    };

    var submitResource = function(request, resource) {
        if (resource) {
            var doc = this._toJSONQuoteFunctions(resource);
            var entity = new org.apache.http.client.methods.StringRequestEntity(doc, "application/json", "UTF-8");
            request.setRequestEntity(entity);
        }
        return this._submitRequest(request);
    };
});
