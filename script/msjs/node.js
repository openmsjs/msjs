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

//need this to express the dependency
var node = {};

node.doesRemoteUpdate = false;

node._lastChecked = -1;
node._lastMsjRefresh = -1;


/**
    Nodes have formal dependencies on other nodes, and each has a reference to
    the graph object that contains them. Nodes are usually constructed with
    calls to {@link msjs}.
    @class A participant in the msjs graph.
    @name msjs.node
*/
node.rawMake = function(){
    var self = function(){ return self.get(); }
    for (var memberName in node){
        if (memberName == "rawMake") continue;
        self[memberName] = node[memberName];
    }
    self._packageName = msjs.context.loadingPackage;
    return self;
}

/**
    The method that this node runs to calculate its msj. This method is
    automatically called when  one of the nodes it depends on changes, when
    update is called with no arguments, or when the graph starts, if it has no
    dependencies or it's marked {@link msjs.node#dirty}. Although this is
    usually passed in with the call to {@link msjs} it can also be set directly
    on the node instance. When called as a result of a graph update, the
    produceMsj function is called with an object whose keys are msj's that of
    the nodes that this node {@link msjs.node#push}es or {@link
    msjs.node#pull}s.  In cases where the produceMsj function returns the
    undefined value (as distinct from null,) the node is considered "not
    updated" for this clock cycle, and nodes depending on this one will behave
    accordingly. Nodes with no given produceMsj method use the default, which
    returns undefined.

    @name produceMsj
    @param {Dictionary} msj The values for msj's of nodes that are pushed or pulled
    by this node.
    @return The msj for this node.
    @methodOf msjs.node#
*/
node.produceMsj = function(msj){}

node.getId = function(){
    return this._id;
}

/**
    Adds an edge in the graph from the given node to this one. Accepts multiple arguments
    @param {msjs.node, String} otherNodeRef A reference to another node, given as either
    a package name to be loaded with {@link msjs#require} or as a direct reference to a
    node in the same graph.
    @return {msjs.node} this
    @name depends
    @methodOf msjs.node#
*/
node.depends = function(){
    var self = this;
    msjs.each(arguments, function(otherNodeRef){
        var otherNode = self._resolveReference(otherNodeRef);
        self.graph.addEdge(otherNode, self);
    });
    return this;
}

node._resolveReference = function(nodeOrPackage){
    if (typeof nodeOrPackage == "string"){
        //Treat as packagename
        nodeOrPackage =  msjs.require(nodeOrPackage);
    }

    return nodeOrPackage;
}

/**
    Refresh this node's msj either with the supplied argument or by running the
    node's produce function. Calls {@link msjs.graph#putUpdate} with the result.
    @name update
    @methodOf msjs.node#
    @param msj The new value for the node's msj. If undefined, the node's produce 
    function will run
*/
node.update = function(msj){
    if (msj === void 0) msj = this.produceMsj();
    var graphUpdate = {};
    graphUpdate[this.getId()] = msj;
    this.graph.putUpdate(graphUpdate);
}

node.get = function(){
    return msjs.copy(this._msj);
}

/**
    Get the last msj produced by this node.
    @name getMsj
    @methodOf msjs.node#
    @return Last msj for this node, either returned from produceMsj or passed in by update.
*/
node.getMsj = function(){
    return this._msj;
}

//called by graph
node.updateMsj = function(msj, clock){
    this.dirty = false;
    if (msj !== void 0){
        this._msj = msj;
        this._lastMsjRefresh = clock;
        this._lastChecked = clock;
    }
    return this._lastMsjRefresh;
}

//Override
node._debugRef;
node._getDebugName = function(){
    var name = this._packageName +"#"+ this.getId();
    if (this._debugRef) name += ":" + this._debugRef;
    return name;
}

//not true for nodes which are cached or notPacked
node.isLocal = true;

node.onLoad = null;
node.onConnectionError = null;
/**
    Internal API. Unpack this node on the client
    @name unpack
    @methodOf msjs.node#
*/
node.unpack = function(packed){
    for (var k in packed){
        this[k] = msjs.unpack(packed[k]);
    }
}

node._packMe = null;

/**
    Internal API. Ensure that the cached version of the given node's msj is
    up-to-date with the clock.
    @return {Number} {@link msjs.graph#clock} time at which this node was last updated
    @name refreshMsj
    @methodOf msjs.node#
*/
node.refreshMsj = function(){
    var tick = this.graph.clock;

    //just an optimization
    if (this._lastChecked == tick) return this._lastMsjRefresh;

    var dependencies = this.graph.getDependencies(this);
    //sources update at the beginning
    var maxRefreshed = dependencies.length ? -1 : 0;
    for (var i=0; maxRefreshed != tick && i<dependencies.length; i++){
        maxRefreshed = Math.max(maxRefreshed, dependencies[i].getLastUpdate());
    }

    var needsUpdate = (maxRefreshed>this._lastChecked);
    //msjs.log('refresh', this._debugRef, dependencies.length, maxRefreshed, needsUpdate);
    if (needsUpdate){
        this.updateMsj(this.produceMsj(), tick);
    }

    this._lastChecked = this.graph.clock;

    return this._lastMsjRefresh;
};

node.getLastUpdate = function(){
    return this._lastMsjRefresh;
};

node.getNode = function(nid){
    return this.graph.getNode(nid);
}

node.invalidate = function(){
    this._lastChecked = -1;
    this._lastMsjRefresh = -1;
}

node.reset = function(newMsj){
    this._msj = newMsj;
}

node._inputs = {};
node._transient = {};


node._ensureHasOwn = function(prop){
    if (!this.hasOwnProperty(prop)){
        if (msjs.isArray(this[prop])){
            this[prop] = this[prop].concat();
        } else {
            this[prop] = msjs.copy(this[prop]);
        }
    }
}

msjs.publish(node, "Client");

node.isUpdated = function(){
    return this.getLastUpdate() == this.graph.clock;
}

/**
    Instructions about the packing disposition of this instance, for transport
    to the client. If true, the node must be packed and transported to the
    client. If false, the node can't be packed. If null, then msjs should decide
    whether or not to pack the node.
    @name setPack
    @methodOf msjs.node#
*/
node.setPack = function(doPack){
    this._packMe = doPack;
    return this;
}

/*! msjs.server-only **/
//protected
node.shutdown = function(){ }

node._future = null;
node._asyncLock = null;
/**
    Run a function (usually one which calls update on the node itself) asynchronously.
    This is useful for allowing a graph update to complete while a node does an
    expensive calculation or calls out to a web service. Nodes which use this method
    must be set to _packMe=false. A given node's update function is protected by its own
    lock, so an individual node will only run one async function at a time.
    @return {Future} A Java future representing the function run
    @param {Function} A function to run asynchronously.
    @name async
    @methodOf msjs.node#
*/
node.async = function(f){
    //since this function is entered synchronously, it's ok to make this lazily right here
    //use a fair lock, to order updates
    if (!this._asyncLock) this._asyncLock = new java.util.concurrent.locks.ReentrantLock(true);
    var lock = this._asyncLock;
    var callback = function(){
        lock.lock();
        try {
            f();
        } finally {
            lock.unlock();
        }
    }
    return this.graph.async(f);
}

/**
    Internal API. Pack this node for transport to the client.
    @return {Object} Hash of this node's packed fields.
    @name pack
    @methodOf msjs.node#
*/
node.pack = function(packType){
    var isPacked = packType == "packed";

    var packed = {};
    if (!isPacked) packed.isLocal = false;
    for (var k in this){
        if (this._selectForPack(packType,k)){
            packed[k] = msjs.pack(this[k]);
        }
    }

    if (packed._msj && msjs.toJSON(packed._msj).length>10000){
        msjs.log('long', this, msjs.toJSON(packed._msj).length, 
                         msjs.toJSON(packed._msj).substring(0,100));
    }

    if (isPacked) {
        this.isLocal = false;
        this.produceMsj = node.produceMsj;
    } else if (packType == "cached") {
        this.doesRemoteUpdate = true;
    }
    return packed;
}

node._msjs_getUnpacker = function(){
    return [this._unpackF, [this.getId()] ];
}

//just a template for unpacking
node._unpackF = function(id){
    return msjs.require("msjs.graph").getNode(id);
};

node._unpackMessengerF = function(id){
    return msjs.require("msjs.graph").getNode(id).messenger();
};

node._selectForPack = function(packType, k){
    if (isNotMember(this, k)) return false;

    //only pack ids of not packed nodes
    if (k == "_id") return true;
    if (k == "_debugRef" && this._debugRef != node._debugRef) return true;
    if (packType == "notPacked") return false;

    //cached members
    if (k == "_msj") return true;
    if (k == "_lastMsjRefresh") return true;
    if (packType == "cached") return false;

    //packed members
    //be sure to pack produceMsj, even though it appears in nodeMembers
    if (k == "produceMsj") return true;

    return true;

}

node.getInputs = function(){
    var inputs = {};
    var freeVars = msjs.context.getFreeVariables(this.produceMsj);
    for (var k in freeVars){
        var n = freeVars[k];
        if (!n) continue;
        if (n instanceof java.lang.Object) continue;
        if (n.isMsjsNode) inputs[n.getId()] = true;
    }

    var inputsList = [];
    for (var id in inputs) inputsList.push(id);
    return inputsList;
}

node.isMsjsNode = true;

node._setDebugInfo = function(localName){
    this._debugRef = localName;
}

var dontPack = {
    prototype : true,
    _packMe : true,
    constructor : true,
    graph : true
}

function isNotMember(instance, name){
    return dontPack[name] ||
           instance[name] == node[name] ||
           !instance.hasOwnProperty(name);
}

node._msjs_isPackable = function(){
    var producePackable = msjs.isPackable(this.produceMsj);
    if (producePackable != null) return producePackable;

    for (var k in this){
        if (isNotMember(this, k)) continue;
        var p = msjs.isPackable(this[k]);
        if (p != null) return p;
    }

    return null;
}
