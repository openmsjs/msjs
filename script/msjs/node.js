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
node.depends = function(otherNodeRef){
    var otherNode = this._resolveReference(otherNodeRef);
    this._graph.addEdge(otherNode, this);
    return otherNode;
}

node._resolveReference = function(nodeOrPackage){
    if (typeof nodeOrPackage == "string"){
        //Treat as packagename
        return msjs.require(nodeOrPackage);
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
    if (msj === void 0) msj = this._composeMsj();
    var graphUpdate = {};
    graphUpdate[this.getId()] = msj;
    this._graph.putUpdate(graphUpdate);
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
   Protected. Compose the msj produced by this node 
   @return The msj for this node. If the undefined value is returned by this
   method, it indicates that the node's msj has not changed. This permits
   optimizations in the update process -- if none of a node's dependencies have
   updated, the node is, by-definition, clean. 
   @name _composeMsj
   @methodOf msjs.node#
*/
node._composeMsj = function(){
    return this.produceMsj(this._collectInputs());
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

node.reset = function(newMsj){
    this._msj = newMsj;
}

node._inputs = {};
node._transient = {};


//This method is deprecated. Use node.push instead
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

/**
    Used to signal that the model has a dependency which is not explicitly set when the
    model is created. models check their expectations when they run their {@link 
    msjs.node#produceMsj} method and throw if the expected channel isn't set.
    @name expects
    @methodOf msjs.node#
    @param {String} channel The name of the channel that this node expects to be set.
*/
node.expects = function(property){
    this._ensureHasOwn("_expectations");
    this._expectations.push(property);
}

node._expectations = [];

/**
    Expresses a dependency between another node and this one, and sets the channel that
    the other node's msj will arrive on  in this node's produceMsj function. This is the 
    simplest way to wire two nodes together, and it's usually the right one. With a push
    relationship, the msj from the other node will only be set if the other node has updated
    during this graph clock tick. To make sure the message is always present, use
    {@link msjs.node#pull} in conjunction with {@link msjs.node#depends}.
    @name push
    @methodOf msjs.node#
    @param nodeOrPackage A string name of a package with a published binding for a node, 
    or a direct reference to another node
    @param {String} property The name of the channel on which to receive the other
    node's message.
    @return this
*/
node.push = function(nodeOrPackage, property){
    this.set(property, nodeOrPackage, true);
    return this;
}

/**
    Adds the msj for the provided node to argument provided to this node's produceMsj
    function, without expressing a dependency on that node. This method should be
    used with care; it's intended for retrieving information that is guaranteed to
    change before the other dependencies for this node force recalculation. Examples
    of this type of data include user information that doesn't change after it's set,
    or cache information that's used for rendering. This method is also handy
    for breaking circular push dependencies, in cases where not all the
    relationships need to be dependencies. This method can be used in
    conjunction with {@link msjs.node#depends} in order to always receive
    the message from another node, whether it's been updated or not. To just
    receive messages when another node changes, use {@link msjs.node#push} 

    @name pull
    @methodOf msjs.node#
    @param nodeOrPackage A string name of a package with a published binding for a node, 
    or a direct reference to another node
    @param {String} property The name of the channel on which to receive the other
    node's message.
    @return this
*/
node.pull = function(nodeOrPackage, property){
    var node = this._resolveReference(nodeOrPackage);
    this._ensureHasOwn( "_inputs" );
    this._inputs[property] = node.getId();
    return this;
}

/**
    Protected. Prepares the input to the normal msj generation function. Nodes
    which are set with the isTransient flag turned on will only have their msj
    included in this hash if they have updated since the last time this node's
    _composeMsj function has run. See {@link msjs.node#set} for more on this.
    @return {Object} Hash of the msj's of upstream nodes, by property name.
    @name _collectInputs
    @methodOf msjs.node#
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


node._asFunction = null;
node.asFunction = function(){
    var self = this;
    if (!this._asFunction){
        var f = function(){ return msjs.copy(self.getMsj()); }

        //don't look at this for packability
        f._msjs_isPackable = msjs._msjs_isPackable;
        f._msjs_node = self;
        f.depends = function(){
            return self.depends.apply(self, arguments);
        }

        return f;
    }
}
msjs.publish(node, "Client");

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
    return this._graph.async(f);
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
