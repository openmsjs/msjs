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

/**
    Invoke JSON web service requests and handle JSON responses.
    @namespace A msjs.httprequest singleton instance that handles JSON request and responses.
    @name msjs.jsonrequest
    @see msjs.httprequest
*/
var jsonConverter = msjs.require("java.org.msjs.service.JSONConverter");
var httpRequest = msjs.require("msjs.httprequest");
msjs.publish(new httpRequest(jsonConverter, "application/json"), "Singleton");


/**
    Make a GET method HTTP call.
    @param {String} url Fully qualified URL.
    @return {Object} an object containing a status code and a result value like
    {status: <status>, result: <result>}.
    @name get
    @methodOf msjs.jsonrequest#
*/

/**
    Make a DELETE method HTTP call.
    @param {String} url Fully qualified URL.
    @return {Object} an object containing a status code and a result value like
    {status: <status>, result: <result>}.
    @name del
    @methodOf msjs.jsonrequest#
*/

/**
    Make a POST method HTTP call.
    @param {String} url Fully qualified URL.
    @param {String} content The content of the request. Uses UTF-8 encoding.
    @return {Object} an object containing a status code and a result value like
    {status: <status>, result: <result>}.
    @name post
    @methodOf msjs.jsonrequest#
*/

/**
    Make a PUT method HTTP call.
    @param {String} url Fully qualified URL.
    @param {String} content The content of the request. Uses UTF-8 encoding.
    @return {Object} an object containing a status code and a result value like
    {status: <status>, result: <result>}.
    @name put
    @methodOf msjs.jsonrequest#
*/
