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
var nodeConstructor = function(){};
var node = nodeConstructor.prototype;

node.NOT_UPDATED = void 0;//must match graph
node.doesRemoteUpdate = false;

node._msjF = null;
node.dirty = false;
node._msj = node.NOT_UPDATED;
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
    var newNode = new nodeConstructor();
    return newNode;
}


node.getId = function(){
    return this._id;
}

/**
    Adds an edge in the graph from the given node to this one. Also marks
    this node as dirty. This can be useful in cases where a node needs to
    recalculate its message due to a change in another node, but doesn't
    actually require that node's msj. This is also useful in conjunction with
    {@link msjs.node#pull} to express an "always" depdency, since {@link
    msjs.node#push} only includes the msj for the dependency if that node
    updated during the current clock cycle.
    @example
    //Renderer needs both model and selection, no matter which one updates.
    renderer.pull(renderer.depends(model), "model");
    renderer.pull(renderer.depends(selection), "selection");
    @param {msjs.node, String} otherNodeRef A reference to another node, given as either
    a package name to be loaded with {@link msjs#require} or as a direct reference to a
    node in the same graph.
    @return {msjs.node} The other node for which the dependency was created.
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

    if (typeof nodeOrPackage == "function"){
        nodeOrPackage = nodeOrPackage._msjs_node;
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


//Override
node._getDebugName = function(){
    return this._packageName +"#"+ this.getId() + ":" + this._debugRef;
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

/**
    Instructions about the packing disposition of this instance, for transport
    to the client. If true, the node must be packed and transported to the
    client. If false, the node can't be packed. If null, then msjs should decide
    whether or not to pack the node.
    @name packMe
    @fieldOf msjs.node#
    @type boolean or null
*/
node.packMe = null;

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

    //only update if the depedencies were dirty, or this node was directly
    //marked dirty
    var needsUpdate = (maxRefreshed>this._lastChecked) || this.dirty;
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
/**
    The node's "super" call. Calls the next version of the named
    method in the prorotype inheritance chain. Note that currently, incorrect
    arguments to this function (such as the wrong fName) will yield a stack
    overflow.
    @param {String} fName The name of the method.
    @param {Function} currF The currently exectuting function. Usually
    "arguments.callee" in the context of the currently executing method.
    @param {Array} args The list of arguments with which to call the call
    the superclass method.
    @name callInherited
    @methodOf msjs.node#
*/
node.callInherited = function ( fName, currF, args ){
    var p = this;
    var foundIt = false;

    while( p ){
        if ( p[ fName ] == currF ){
            foundIt = true;
        } else if ( foundIt ) {
            break;
        }
        p = p.constructor.prototype;
    }

    if ( p && p [fName ] ){
        return p[ fName ].apply(this, args || msjs.THE_EMPTY_LIST);
    } else {
        throw( "Couldn't find method " + fName + " in " + p );
    }
}


node._messenger = null;
node.messenger = function(){
    var self = this;
    if (!this._messenger){
        this._messenger = function(){ return self.get(); }

        //don't look at this for packability
        this._messenger._msjs_isPackable = msjs._msjs_isPackable;
        this._messenger._msjs_node = this;
        this._messenger.graph = this.graph;
        msjs.each(["depends", "update", "isUpdated", "getId", "async"], function(name){
            self._messenger[name] = function(){
                var r = self[name].apply(self, arguments);
                //return the messenger, not the node
                return r == self ? this : r;
            }
        });

        this._messenger._msjs_getUnpacker = function(){
            return [self._unpackMessengerF, [self.getId()] ];
        };

    }

    return this._messenger;
}
msjs.publish(node, "Client");

node.isUpdated = function(){
    return this.getLastUpdate() == this.graph.clock;
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
    must be set to packMe=false. A given node's update function is protected by its own
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
    if (!this.hasOwnProperty(k)) return false;
    if (k == "_id") return true;
    if (packType == "notPacked") return false;

    if (k == "_msj"){
        return this.graph.needsMsjPack(this.getId());
    }
    if (k == "_lastMsjRefresh") return true;
    if (packType == "cached") return false;

    if (k == "packMe") return false;
    if (k == "constructor") return false;
    if (k == "graph") return false;
    if (k == "_messenger") return false;

    return true;

}

node.needsCachedMsj = function(otherNid){
    var needsMsj = false;
    for (var channel in this._inputs){
        if (this._inputs[channel] == otherNid){
            if (!this._transient[channel]) return true;
        }
    }

    return false;
}

node.getInputs = function(){
    var inputs = {};
    for (var channel in this._inputs){
        inputs[(this._inputs[channel])] = true;
    }

    var freeVars = msjs.context.getFreeVariables(this.produceMsj);
    for (var k in freeVars){
        var n = freeVars[k];
        if (!n) continue;
        if (n instanceof java.lang.Object) continue;
        if (n._msjs_node) n = n._msjs_node;
        if (n instanceof node) inputs[n.getId()] = true;
    }

    var inputsList = [];
    for (var id in inputs) inputsList.push(id);
    return inputsList;
}

node._setDebugInfo = function(localName, packageName){
    if (!this.hasOwnProperty("_debugRef")) this._debugRef = localName;
    if (!this.hasOwnProperty("_packageName")) this._packageName = packageName;
}
