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

var jsonRequest = msjs.require("msjs.jsonrequest");
var defaultFile = "couch.databases";
var defaultHost = "localhost";
var defaultPort = 5984;

var status = $(<div/>).css({fontSize: "20px"}).appendTo("body");

$(<div>
    <b>Query parameters:</b>
    <ul>
        <li><b>db</b>: (required) databases to reload from file; one of:
            <ul>
                <li>a single database name</li>
                <li>comma-separated database names</li>
                <li>"_all" for all databases</li>
            </ul>
        </li>
        <li><b>file</b>: file where couch data and views are defined <i>(default: {defaultFile})</i></li>
        <li><b>reset</b>: set to true to delete the database before reloading; data in couch file <i>(default: false)</i></li>
        <li><b>host</b>: couch host <i>(default: {defaultHost})</i></li>
        <li><b>port</b>: couch port <i>(default: {defaultPort})</i></li>
    </ul>
</div>).css({border: "1px solid", padding: "10px", color: "teal", marginTop: "50px"}).appendTo("body");

var couch = msjs(function() {
    var request = msjs.require("java.javax.servlet.http.HttpServletRequest");
    var host = request.getParameter("host") || defaultHost;
    var port = request.getParameter("port") || defaultPort;
    var file = request.getParameter("file") || defaultFile;
    var reset = request.getParameter("reset") == "true";

    var couchData = msjs.require(file);
    var dbNames = (function() {
        var dbParam = request.getParameter("db");

        var dbNames = null;
        if (dbParam == "_all") {
            dbNames = [];
            for (var dbName in couchData) dbNames.push(dbName);
        } else if (dbParam) {
            dbNames = dbParam.split(",");
        }

        return dbNames;
    })();

    if (!dbNames) {
        status.text("Please set db query param.").css("color", "red");
        return;
    }

    var couchUrl = "http://" + host + ":" + port;
    jQuery.each(dbNames, function(i, dbName) {
        var db = couchUrl + "/" + dbName;

        var response = jsonRequest.get(db);
        var created = reset;
        if (reset) {
            if (jsonRequest.isSuccess(response)) {
                jsonRequest.del(db);
            }
            jsonRequest.put(db);
        } else {
            if (!jsonRequest.isSuccess(response)) {
                jsonRequest.put(db);
                created = true;
            }
        }

        if (couchData[dbName].views) {
            jQuery.each(couchData[dbName].views, function(i, view) {
                jsonRequest.put(db + "/" + view._id,
                                msjs.toJSONWithFunctions(view, true));
            });
        }

        if (created) {
            if (couchData[dbName].docs) {
                jQuery.each(couchData[dbName].docs, function(i, doc) {
                    if (doc._id) {
                        jsonRequest.put(db + "/" + doc._id, msjs.toJSON(doc));
                    } else {
                        jsonRequest.post(db + "/", msjs.toJSON(doc));
                    }
                });
            }
        }
    });

    status.text("Reloaded " + dbNames.join(", ") + " " + (dbNames.length == 1 ? "database" : "databases") + ".");
});
couch.packMe = false; 
