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

var node = {};

node.doesRemoteUpdate = false;

node.lastMsjUpdate = -1;


/**
    Nodes have formal dependencies on other nodes, and each has a reference to
    the graph object that contains them. Nodes are usually constructed with
    calls to {@link msjs}. The node is itself a function. When called with no 
    arguments, it returns the cached msj for this node. When called with an
    argument, it sets the cached msj for this node to the given value and starts
    a graph update.
    @example
        var updater = msjs();
        var listener = msjs(function(){
            return updater();
        }).depends(updater);

        updater(2);
        assert(listener() == 2);
    @class A participant in the msjs graph.
    @name msjs.node
*/
msjs.publish(function(){
    var self = function(arg){ 
        if (arg === void 0) return msjs.copy(self._msj); 
        var graphUpdate = {};
        graphUpdate[self.getId()] = arg;
        self.graph.putUpdate(graphUpdate);
    }

    for (var memberName in node){
        self[memberName] = node[memberName];
    }
    return self;
}, "Client");

/**
    The method that this node runs to calculate its msj. This method is
    automatically called when  one of the nodes it depends on changes, or when
    the graph starts, if it has no dependencies. Although this member is usually
    passed in with the call to {@link msjs} it can also be set directly on the
    node instance.  In cases where the produceMsj function returns the
    undefined value (as distinct from null,) the node is considered "not
    updated" for this clock cycle, and nodes depending on this one will behave
    accordingly. Nodes with no given produceMsj method use the default, which
    returns undefined.

    @name produceMsj
    @return The msj for this node.
    @methodOf msjs.node#
*/
node.produceMsj = function(msj){}

node.getId = function(){
    return this._id;
}


/**
    Get the last msj produced by this node. Unlike calling the node directly,
    this method returns the actual cached value of the node's msj, so this can
    be used to avoid copying a large msj. Just be careful not to modify values
    returned by this method.
    @name getMsj
    @methodOf msjs.node#
    @return Last msj for this node, either returned from produceMsj or passed in by update.
*/
node.getMsj = function(){
    return this._msj;
}

node.ifUpdated = function(){
    if (this.isUpdated()) return this();
}

//called by graph
node.updateMsj = function(msj, clock){
    if (msj !== void 0){
        this._msj = msj;
        if (clock != null){
            this.lastMsjUpdate = clock;
        }
    }
    return this.lastMsjUpdate;
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

//TODO: Document these
node.onLoad;
node.onConnectionError;

node.invalidate = function(){
    this.lastMsjUpdate = -1;
}

node.isUpdated = function(){
    return this.lastMsjUpdate == this.graph.clock;
}

/*! msjs.server-only **/

/**
    Adds an edge in the graph from the given node to this one. Accepts multiple arguments
    @param {msjs.node, String} otherNodeRefs References to another node, given as either
    a package name to be loaded with {@link msjs#require} or as a direct reference to a
    node in the same graph. This method is variadic; it accepts multiple dependencies in
    a single call
    @example
    myNode.depends(otherNode, yetAnotherNode);
    @return {msjs.node} this
    @name depends
    @methodOf msjs.node#
*/
node.depends = function(){
    var self = this;
    msjs.each(arguments, function(otherNodeRef){
        var otherNode = resolveReference(otherNodeRef);
        self.graph.addEdge(otherNode, self);
    });
    return this;
}

resolveReference = function(nodeOrPackage){
    if (typeof nodeOrPackage == "string"){
        //Treat as packagename
        nodeOrPackage =  msjs.require(nodeOrPackage);
    }

    return nodeOrPackage;
}

/**
    Instructions about the packing disposition of this instance, for transport
    to the client. If true, the node must be packed and transported to the
    client. If false, the node can't be packed. If null, then msjs should decide
    whether or not to pack the node.
    @methodOf msjs.node#
    @name setPack
    @return {msjs.node} this
*/
node.setPack = function(doPack){
    this._packMe = doPack;
    return this;
}


node._packMe = null;



//protected
//TODO: Document this
node.shutdown;

node._future;
node._asyncLock;
/**
    Run a function (usually one which calls update on the node itself) asynchronously.
    This is useful for allowing a graph update to complete while a node does an
    expensive calculation or calls out to a web service. Nodes which use this method
    must be setPack(false). A given node's update function is protected by its own
    lock, so an individual node will only run one async function at a time.
    @example
    var keepGoingNode = msjs( function(){
        var self = this;
        this.async(function(){
            self.update(slowResource.computeResult());
        });
        return "working";
    });
    
    @return {Future} A Java future representing the function run
    @param {Function} f A function to run asynchronously.
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
        if (selectForPack(this, packType,k)){
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

//just a template for unpacking
var unpackFunction = function(id){
    return msjs.require("msjs.graph").getNode(id);
};

node._msjs_getUnpacker = function(){
    return [unpackFunction, [this.getId()] ];
}


selectForPack = function(node, packType, k){
    if (isNotMember(node, k)) return false;

    //only pack ids of not packed nodes
    if (k == "_id") return true;
    if (k == "_debugRef" && node._debugRef != node._debugRef) return true;
    if (packType == "notPacked") return false;

    //cached members
    if (k == "_msj") return true;
    if (k == "lastMsjUpdate") return true;
    if (packType == "cached") return false;

    //packed members
    //be sure to pack produceMsj, even though it appears in nodeMembers
    if (k == "produceMsj") return true;

    return true;

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

//This is confusing, but determinePack inspects the members
//of a node to see if it should be packed. _msjs_isPackable must
//be defined to be ambivalent, so that closing over a node in a
//produce function doesn't otherwise alter the packing disposition
//of the node
node._msjs_isPackable = function(){
    return null;
}

node.determinePack = function(){
    if (this._packMe != null) return this._packMe;
    if (this.onLoad || this.onConnectionError) return true;

    var producePackable = msjs.isPackable(this.produceMsj);
    if (producePackable != null) return producePackable;

    for (var k in this){
        if (isNotMember(this, k)) continue;
        var p = msjs.isPackable(this[k]);
        if (p != null) return p;
    }

    //default to packing nodes
    return true;
}
