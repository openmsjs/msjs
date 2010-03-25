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
    @name node
    @constructor 
    @class A participant in the msjs graph. Nodes have formal
    dependencies on other nodes, and each have a reference to 
    the graph object that contains them.
    @example var myNode = node.make(function(){return myMsj})
    @param {Function} msjF The function which renders the msj for this node.
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
    this node as dirty.
    @param {node} otherNode The node that this node depends on.
*/
node.depends = function(otherNodeRef){
    var otherNode = this.resolveReference(otherNodeRef);
    this._graph.addEdge(otherNode, this);
    return otherNode;
}

node.resolveReference = function(nodeOrPackage){
    if (typeof nodeOrPackage == "string"){
        //Treat as packagename
        return msjs.require(nodeOrPackage);
    }

    return nodeOrPackage;
}

/**
    Mark node as dirty and refresh msj.
*/
node.update = function(msj){
    if (msj === void 0) msj = this._composeMsj(); 
    this._graph.putUpdate(this, msj);
}

/**
    Get the msj produced by this node.
*/
node.getMsj = function(){
    return this._msj;
}

//called by graph
node.updateMsj = function(msj, clock){
    this.dirty = false;
    if (msj !== this.NOT_UPDATED){
        this._msj = msj;
        this._lastMsjRefresh = clock;
        this._lastChecked = clock;
    }
    return this._lastMsjRefresh;
}

/**
    Compose the msj produced by this node 
   @return The msj for this node. If the static value node.NOT_UPDATED is returned
   by this method, it indicates that the node's msj has not changed. This
   permits optimizations in the update process -- if none of a node's dependencies have
   updated, the node is, by-definition, clean. 
*/
node._composeMsj = function(){
    return this.produceMsj(this._collectInputs());
}

node.produceMsj = function(msj){}//returns undefined === NOT_UPDATED 


//Override
node._getDebugName = function(){
    return this._packageName +"#"+ this.getId() + ":" + this._debugRef;
}

//not true for nodes which are cached or notPacked
node.isLocal = true;

node.onLoad = null;
node.onConnectionError = null;
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
*/
node.packMe = null;

/**
    Ensure that the cached version of the given node's msj is up-to-date with the
    clock.
    @param {Number} nodeId The ID of the node to clean.
    @return {Number} If time at which this node was last updated
*/
node.refreshMsj = function(){
    var tick = this._graph.clock;

    //just an optimization
    if (this._lastChecked == tick) return this._lastMsjRefresh;

    var dependencies = this._graph.getDependencies(this);
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
        this.updateMsj(this._composeMsj(), tick);
    }

    this._lastChecked = this._graph.clock;

    return this._lastMsjRefresh;
};

node.getLastUpdate = function(){
    return this._lastMsjRefresh;
};

node.getNode = function(nid){
    return this._graph.getNode(nid);
}

node.invalidate = function(){
    this._lastChecked = -1;
    this._lastMsjRefresh = -1;
}

node._inputs = {};
node._transient = {};

/**
    Provide the msj of the given node as a property of the input of this node' msj function. 
    @param {String} property The name to use for the input property.
    @param {msjs.node} node The node whose msj should be delivered under the given property
    name.
    @param {Boolean} isTransient If true, the value for this slot will be null unless node
    has updated since the last time this node's msj was retrieved. This is useful for 
    modeling transient updates in the system, such as form submission
*/
node.set = function(property, nodeOrPackage, isTransient){ //careful; "transient" is keyword
    var node = this.depends(nodeOrPackage);
    if (!node || !node.getId) throw "Can't set " + property + " in " + this._getDebugName();

    this._ensureHasOwn( "_inputs" );
    var nodeId = node.getId();
    this._inputs[property] = nodeId;
    if (isTransient){
        this._ensureHasOwn("_transient");
        this._transient[property] = true;
    }

    return node;
}

//this is used to signal that the model has a dependency which is not explicitly set when the
//model is created. models check their expectations when they run produce
node.expects = function(property){
    this._ensureHasOwn("_expectations");
    this._expectations.push(property);
}

node._expectations = [];

node.push = function(nodeOrPackage, property){
    this.set(property, nodeOrPackage, true);
    return this;
}

node.get = function(nodeOrPackage, property){
    var node = this.resolveReference(nodeOrPackage);
    this._ensureHasOwn( "_inputs" );
    this._inputs[property] = node.getId();
    return this;
}

/**
    Protected method that prepares the input to the normal msj generation function. Nodes
    which are set with the isTransient flag turned on will only have their msj included in
    this hash if they have updated since the last time this node's _composeMsj function has
    run. See {@link msjs.node#set} for more on this.
    @return {Object} Hash of the msj's of upstream nodes, by property name.
*/
node._collectInputs = function(){
    var msj = {};
    var graph = this._graph;

    for (var k in this._inputs){
        var node = graph.getNode(this._inputs[k]);

        if (this._expectations.length){
            for (var i=0; i<this._expectations.length; i++){
                if (k == this._expectations[i]){
                    this._expectations.splice(i,1);
                    break;
                }
            }
        }

        if ( this._transient[k] && (node.getLastUpdate() < this._graph.clock) ){
            continue;
        }

        var val = node.getMsj(); 

        msj[k] = val;
    }
    
    if (this._expectations.length) {
        throw (this._getDebugName() + " expects " + this._expectations);
    }

    if (this.copyInputs) msj = msjs.copy(msj);
    return msj;
};

node.copyInputs = true;

/**
    Make an instance copy of a shared class Object or Array, if necessary. This method
    copies an shared class arrays or hashes into the instance.

    @param {String} prop The name of the property to be copied into the instance.
*/
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
    The msjs "super" call. Calls the next version of the named method
    in the prorotype inheritance chain. Note that currently, incorrect
    arguments to this function (such as the wrong fName) will yield 
    a stack overflow.
    @param {String} fName The name of the method.
    @param {Function} currF The currently exectuting function. Usually
    "arguments.callee" in the context of the currently executing method.
    @param {Array} The list of arguments with which to call the call
    the superclass method.
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


msjs.publish(node, "Client");

/*! msjs.server-only **/
//protected
node.shutdown = function(){ }

node._future = null;
node._asyncLock = null;
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
    return this._graph.async(f);
}

/**
    Pack this node for transport to the client.
    @return {Object} Hash of this node's packed fields.
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

node._selectForPack = function(packType, k){
    if (!this.hasOwnProperty(k)) return false;
    if (k == "_id") return true;
    if (packType == "notPacked") return false;

    if (k == "_msj"){
        return this._graph.needsMsjPack(this.getId());
    }
    if (k == "_lastMsjRefresh") return true;
    if (packType == "cached") return false;

    if (k == "packMe") return false;
    if (k == "constructor") return false;
    if (k == "_graph") return false;

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
    var inputs = [];
    for (var channel in this._inputs){
        inputs.push(this._inputs[channel]);
    }
    return inputs;
}

node._setDebugInfo = function(localName, packageName){
    if (!this.hasOwnProperty("_debugRef")) this._debugRef = localName;
    if (!this.hasOwnProperty("_packageName")) this._packageName = packageName;
}
