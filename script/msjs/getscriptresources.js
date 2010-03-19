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

/*! msjs.server-only **/

//map of JSON list of scripts to md5 hash of corresponding script
var keyMap = new java.util.concurrent.ConcurrentHashMap();
//map of md5 hash of script to script
var contentMap = msjs.require("java.org.msjs.script.ScriptCache");
var lock = new java.util.concurrent.locks.ReentrantLock();
var md5er = msjs.require("java.org.msjs.service.MD5");
var config= msjs.require("java.org.msjs.config.MsjsConfiguration");
var doCache = config.getBoolean("doCache");
var scriptLocator = msjs.require("java.org.msjs.script.ScriptLocator");

//this is a function so that it can be obfuscated;
var loadPackage = function(packageName){
    msjs.context.setLoadingPackage(packageName);
}

var loadPackageString = "("+loadPackage.toString()+")";

var doSetLoadingPackage= function(packageName){
    return !(packageName == "msjs" || packageName == "context");
}


var makeCachedScript = function(scripts){
    lock.lock();
    try{
        var scriptBuffer = new java.lang.StringBuffer();
        msjs.each(scripts, function(packageName){
            if (doSetLoadingPackage(packageName)){
                scriptBuffer.append("\n");
                scriptBuffer.append("{"+loadPackageString + "('"+packageName+"')}");
                scriptBuffer.append("\n");
            }
            var reader = new Packages.org.msjs.script.ScriptReader(scriptLocator.getReader(packageName));
            reader = new java.io.BufferedReader(reader);
            var line;
            while(true){
                line = reader.readLine();
                if (line == null) break;
                else scriptBuffer.append(line).append("\n");
            }
            scriptBuffer.append("\n");
        });
        var script = scriptBuffer.toString();
        var hash = new java.lang.String(md5er.encrypt(script));
        keyMap.putIfAbsent(msjs.toJSON(scripts), hash);
        contentMap.putIfAbsent(hash, script);
    }finally{
        lock.unlock();
    }
}

msjs.publish(function(scripts){
    var scriptNodes = [];
    var config = msjs.require("java.org.msjs.config.MsjsConfiguration");
    var webappPath = config.getString("webappPath");
    if (doCache){
        var key = new java.lang.String(msjs.toJSON(scripts));

        if (!keyMap.containsKey(key)){
            makeCachedScript(scripts);
        }

        scriptNodes.push(<script src={webappPath + "/" + keyMap.get(key) + ".jc"}/>);
    } else {
        for (var i=0; i<scripts.length; i++){
            var packageName = scripts[i];
            if (doSetLoadingPackage(packageName)){
                scriptNodes.push(
                    <script>{loadPackageString + "('"+packageName+"')"}</script>
                );
            };
            scriptNodes.push(<script src={webappPath + "/" + packageName + ".js"}/>);
        }
    }

    return scriptNodes;
}, "Singleton");
