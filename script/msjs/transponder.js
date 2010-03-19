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

var transponder = msjs.publish(msjs.make());
transponder.packMe = false;
var transponders = msjs.require("msjs.transponders");
transponder.set = function (channel, nodeOrPackage){
    this.callInherited("set", arguments.callee, [channel, nodeOrPackage, true]);
}

transponder.depends = function (nodeOrPackage){
    var node = this.callInherited("depends", arguments.callee, arguments);
    if (node.packMe) throw "Transponder dependencies cannot be packed: " + node._getDebugName();
    node.packMe = false;
    return node;
}

transponder._composeMsj = function(){
    var channels = this._collectInputs();
    var seen = {};
    //don't call back this transponder
    seen[this.getGraphId()] = true;
    msjs.each(this.getOtherGraphIds(channels), function(graphId){
        if (seen[graphId]) return;
        seen[graphId] = true;
        transponders.send(graphId, channels);
    });
}

//This is package private. It's called by msjs.transponders and
//should not be overriden
transponder.acceptTransmission = function(channels){
    var update = {};
    //avoid circular update
    update[this.getId()] = null;
    for (var property in channels){
        var nid = this._inputs[property];
        if (nid != null){
            update[nid] = channels[property];
        }
    }

    this._graph.doLocalUpdate(update);
}

//This is package private. It's called by msjs.transponders and
//should not be overriden
transponder.getGraphId = function(){
    return this._graph.id;
}

transponder.getOtherGraphIds = function (msj){
    return msjs.THE_EMPTY_LIST;
}

transponders.register(transponder);
transponder._graph.setConnected();
