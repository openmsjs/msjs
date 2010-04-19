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
    The object responsible for coordinating the relationships
    among the {@link msjs.node}s in the program.
    @namespace The graph instance that connects the {@link msjs.node}s
    @name msjs.graph
*/
var graph = {};
graph._nodes = [];
graph._adjacencyMatrix = [];
//true==clean, false==dirty
graph._componentDirtiers = [];
graph._tc = null;
graph._cache = {};
graph.NOT_UPDATED = void 0;
graph.id = msjs.context.id;

/**
    Make a new {@link msjs.node}
    @param {Function} produceFunction The function that will be called when dependencies for
    this node change, or, if this node has no dependencies, the function that will be called
    when the graph first starts. This argument is optional. A node with no produce function
    is still useful for sending updates triggered by external events with the 
    {@link msjs.node#update} method. See also the documention for {@link msjs.node#produceMsj}.
    @return {msjs.node} A new {@link msjs.node}
    @name make
    @methodOf msjs.graph#
*/
graph.make = function(produceFunction){
    var node = msjs.require("msjs.node").rawMake();
    if (produceFunction) node.produceMsj = produceFunction;
    var id = this._nodes.length;
    this._nodes.push(node);
    node._id = id;
    node.graph = this;

    //make a new row
    this._adjacencyMatrix[id] = {};

    //invalidate cached, graph meta-information
    this._cache = {};
    return node;
}

/**
    The graph tracks state changes with a clock. Whenever a node is marked
    dirty, the "time" on the clock is recorded, and the clock is advanced. The
    clock may be read freely, even during an update, but never written to.
    @name clock
    @fieldOf msjs.graph#
*/
graph.clock = 0;

//this is a row of zeros that's as long as the node list
//used to append to the adjacency array
graph._empty = [];
graph._connectionErrorListeners = [];

graph.hasRemote = false;

 //number of the last update from the remote that this graph received and processed
graph._expectedUpdateFromRemote = 0;
//number of the last update from this graph that the remote acknowledges receiving
graph._acknowledgedUpdate = 0;
//number of the next update to send
graph._nextUpdateNumber = 0;

//Updates from this graph to its remote
graph._remoteUpdateQueueOffset = 0;
graph._remoteUpdateQueue = [];
/**
    Retrieve the list of messages in the queue for the graph's counterpart
    running elsewhere. This also empties this graph's queue.
    @return {String} A JSON version of the message queue.
    @private
    @name _setRemoteUpdateQueueOffset
    @methodOf msjs.graph#
*/
graph._setRemoteUpdateQueueOffset = function(pos){
    while(this._remoteUpdateQueueOffset < pos){
        this._remoteUpdateQueueOffset++;
        this._remoteUpdateQueue.shift();
    }
}

graph._doingReset = false;
graph.getMsjForRemote = function(){
    this._updateLock.lock();
    try {
        //clear out acknowledged updates
        this._setRemoteUpdateQueueOffset(this._acknowledgedUpdate);

        var updateQueue = [];
        //msjs.assert(this._nextUpdateNumber >= this._remoteUpdateQueueOffset);
        var updateQueueOffset = this._nextUpdateNumber;
        var startPos = updateQueueOffset - this._remoteUpdateQueueOffset; 

        for (var i= startPos; i < this._remoteUpdateQueue.length; i++){
            updateQueue.push( this._remoteUpdateQueue[i] );
            this._nextUpdateNumber++;
        }


        var msj  = {
            hasPendingUpdates : this._hasPendingUpdates(),
            acknowledgeUpdate : this._expectedUpdateFromRemote,
            updateQueueOffset : updateQueueOffset,
            updateQueue : updateQueue
        };

        if (this._doingReset) {
            msj.nodeResets = {};
            //FIXME: This duplicates msjs from nodes with pending updates
            //no harm in this, but it's not as efficient as it could be
            msjs.each(this._nodes, function(node){
                if (node.doesRemoteUpdate){
                    msj.nodeResets[node.getId()] = node.getMsj();
                }
            });
            this._doingReset = false;
        }

        return msj;
    } finally {
        this._updateLock.unlock();
    }
}

graph._hasPendingUpdates = function(){
    return false;
}

graph.getMsjForRemoteAsJSON = function(){
    var wasPressurized = this._valve.open();
    try{
        var msj = null;
        if (wasPressurized){
            msj = this.getMsjForRemote();
        }
        return msjs.toJSONWithFunctions(msj);
    }finally{
        this._valve.close();
    }
}

graph.handleWriteFailure = function(){
    this._valve.pressurize();
}

//This is relatively simple for the client. The server uses a
//fancy Java lock, instantiated below.
graph._valve = {
    open : function(){return true;},
    close : function(){},
    pressurize : function(){graph._sendQueuedMsjs(false)} //failure is not ok
}

graph.acceptMsjFromRemote = function(remote){
    if (!remote) return;

    if (remote.nodeResets){
        for (var id in remote.nodeResets){
            this.getNode(id).reset(remote.nodeResets[id]);
        }

        if (!this.hasRemote){
            //this is a client graph reconnecting to a new server graph
            this.pack();
            this._doingReset = true;
            reopen = true;
        }
    }

    var reopen = false;
    this._remoteHasPendingUpdates = remote.hasPendingUpdates;
    this._acknowledgedUpdate = remote.acknowledgeUpdate;
    //These two get out of sync if this graph tried to send a message to the
    //remote that wasn't received
    this._nextUpdateNumber = remote.acknowledgeUpdate; //TODO: off by one?

    //lastUpdate should be called expectedUpdate
    if ( this._expectedUpdateFromRemote == remote.updateQueueOffset){
        //msjs.log('accept', remote.updateQueue);
        for (var i=0; i<remote.updateQueue.length; i++){
            this._expectedUpdateFromRemote++;
            this._processUpdate(remote.updateQueue[i], false);
        }
    } else if ( this._expectedUpdateFromRemote < remote.updateQueueOffset){
        //TODO: the already-sent updates could be cached here, but for now,
        //ask the remote to send everything since this._expectedUpdateFromRemote
        reopen = true;
    } else {
        //the remote is ahead of this graph; so call invalidate

        //in practice, this must be the stateful client calling a newly
        //manufactured server graph, since a newly constructed server graph
        //can't contact a page that's already loaded 

        //TODO: invalidate()
    }

    if (reopen || this._hasQueuedUpdatesForRemote()) {
        this._valve.pressurize();
    }
}

graph.addEdge = function(fromNode, toNode){
    if (!( fromNode.getId && toNode.getId)){
        msjs.log("Bad edge", fromNode, toNode);
        throw "Bad edge, see log for details.";
    }

    this._adjacencyMatrix[fromNode.getId()][toNode.getId()] = 1;
    //invalidate the the transitive closure, if it exists
    this._tc = null;
    this._cache = {};
}

//Callers must not retain references returned by this function!
graph.getNode = function(nodeId){
    return this._nodes[nodeId];
}

graph.getNodes = function(){
    return this._nodes;
}

graph.getDependencies = function(node){
    var nid = node.getId();
    var result = this.getCachedResult(nid, "dependencies"); 
    if (result == null){
        result = [];
        for (var i=0; i < this._adjacencyMatrix.length; i++){
            if (this._adjacencyMatrix[i][nid]) result.push(this._nodes[i]);

        }
        this.putCachedResult(nid, result, "dependencies");
    }
    return result;
}

graph.getTransitiveClosure = function(){
    return this._tc;
}

graph._connections = [];
//client-only
graph._sendQueuedMsjs = function(allowFail) {
    if (this._reopenTimeout) {
        clearTimeout(this._reopenTimeout);
        this._reopenTimeout = null;
    }
    var iframe = window.frames._msjs_request;
    if (!iframe) {
        var self = this;
        window.loadCallback = function(){self._sendQueuedMsjs();};
        return;
    }

    if (!iframe.sendQueuedMsjs) {
        var self = this;
        iframe.sendQueuedMsjs = function(failOk) {self._sendQueuedMsjsFromIframe(failOk);};
        window["unloadCallback"] = function(){self._abortConnections();};
    }
    iframe.sendQueuedMsjs(allowFail);
}

graph._retry = 0;
graph._serverActions = {
    "redirect" : "_redirect",
    "acceptmsj" : "acceptMsjFromRemote",
    "reconnect" : "_doReconnect",
    "error" : "_handleServerError"
}

//Max age for long poll connection.
//This needs to be shorter than org.msjs.Page.INACTIVE_WAIT_TIME
graph.MAX_LONGPOLL = 5 * 60 * 1000;//5 minutes
graph._needsInitialTimeout = true;
graph._doNotReconnect = false;
graph._sendQueuedMsjsFromIframe = function(failOk) {
    //FIXME: Probably we should parse the url and just post back without any parameters
    //This certainly causes problems if you use 'q' as a GET query parameter on your
    //msjs page.
    if (this._doNotReconnect) return;
    var graph = this;
    var request = new XMLHttpRequest();
    var url = document.location.href;
    var poundIndex = url.indexOf("#");
    if (poundIndex > 0) url = url.substring(0, poundIndex);
    request.open("POST", url, true);
    request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded;charset=UTF-8");
    var allowFail = failOk;
    request.onreadystatechange = function(){

        if (request.readyState == 3) {
            //we heard back from the server, so it's ok if this connection dies
            allowFail = true;
            //5 minutes of long polling max
            graph._setConnectionTimeout(request, graph.MAX_LONGPOLL);
        }

        if (request.readyState == 4){

            if (request.status >= 500){
                if (request) {
                    msjs.log('lost connection to server', request);
                    if (request.responseText) msjs.log(request.responseText);
                }
                graph._abortConnections();
                graph._handleConnectionError("Lost connection to server (" + request.status + ").");
                return;
            }


            var ok = 200 <= request.status && request.status < 300;

            var response = request.responseXML && request.responseXML.firstChild; 
            //msjs.assert(response.nodeName == "response");
            if (ok && response && response.firstChild){
                graph._reopenWaitTime = 100;
                var instruction = response.firstChild;

                var method = graph._serverActions[instruction.nodeName];

                var scriptEl = document.createElement("script");
                scriptEl.type = "text/javascript";

                var script;
                if (method){
                    //make a closure so it can be obfuscated
                    var getGraph = function(){return msjs.require("msjs.graph");};
                    script = "(" + getGraph.toString() + ")()." + method + 
                             "("+instruction.firstChild.nodeValue+")";

                } else {
                    graph._doNotReconnect = true;
                    msjs.log( "Bad server instruction: " , request.responseXML);
                    //Don't throw right here; Firebug won't report it!
                    script = "throw 'Bad server instruction'";
                }

                scriptEl.text = script;

                var head = document.getElementsByTagName("head")[0];

                // HACK: Firebug appears to supress exceptions and this is a
                // workaround
                if (typeof(loadFirebugConsole) == "function") {
                    setTimeout(function() {head.appendChild(scriptEl);}, 10);
                } else {
                    head.appendChild(scriptEl);
                }

            } else {
                // We reach this state when the request is aborted or is an
                // abnormal termination of the request, e.g. back button in safari
                msjs.log("Request failed" , request.responseText.substring(0,2000) +"...");
                if (!allowFail && !graph._doNotReconnect){
                    graph._handleConnectionError("Can't connect to server.");
                }
            }
            graph._removeConnection(request);
        }
    };

    //Don't close the connection -- may be asked to poll
    //NB: This sends even if there are no msjs in queue
    var jsonQ = this.getMsjForRemoteAsJSON();
    //msjs.log(jsonQ);
    var params = "id=" + this.id + "&q=" + encodeURIComponent(jsonQ);

    this._addConnection(request);

    request.send(params);
}


graph._redirect = function(url){
    //client only
    setTimeout(function(){
        location.href = url;
    }, 200);
}

graph._doReconnect = function(newId){
    this.id = newId;
    this.clock = 0;
    this._expectedUpdateFromRemote = 0;
    this._acknowledgedUpdate = 0;

    this._nextUpdateNumber = 0;
    //now shift the update queue back, so that it appears as though
    //info.resendUpdate is the first element in the queue
    this._setRemoteUpdateQueueOffset(this.updateQueueOffset);
    //and tell that the server that this is the first update
    this._remoteUpdateQueueOffset = 0;

    msjs.each(this._nodes, function(node){
        node.invalidate();
    });

    this._doingReset = true;
    this._valve.pressurize();

}

graph._handleConnectionError = function(message) {
    this._doNotReconnect = true;
    msjs.each(this._connectionErrorListeners, function(node) {
        node.onConnectionError(message);
    });

    if (!this._connectionErrorListeners.length) {
        message += '\n\nClick "OK" to reload.';
        if (confirm(message)) window.location.reload();
    }
}


graph._handleServerError = function(errorInfo){
    try{
        this._abortConnections();
    }finally{
        this._handleConnectionError("Error: " + (errorInfo.message || errorInfo));
    }
}


graph._setConnectionTimeout = function(connection, requestTime) {
    var self = this;
    this._clearConnectionTimeout(connection);
    connection._timeout = setTimeout(function() {
        connection.abort();
        //Just to be safe, remove the connection in case abort didn't work
        self._removeConnection(connection);
    }, requestTime);
}

graph._clearConnectionTimeout = function(connection) {
    if (connection._timeout) {
        clearTimeout(connection._timeout);
        connection._timeout = null;
    }
}

graph._addConnection = function(connection) {
    this._setConnectionTimeout(connection, 10 * 1000); //10 seconds to connect
    this._connections.unshift(connection);
}

graph._isConnected = false;
/**
    Forces the connection to stay open between the client and the server.
    @name setConnected
    @methodOf msjs.graph#
*/
graph.setConnected = function(){
    this._isConnected = true;
}

graph._removeConnection = function(connection) {
    this._clearConnectionTimeout(connection);
    for (var i=0; i < this._connections.length; i++) {
        if (connection == this._connections[i]) {
            this._connections.splice(i, 1);
            break;
        }
    }

    this._reopenConnection();
}

//This is also reset when a good response is received from the server
graph._reopenWaitTime = 100;
graph._remoteHasPendingUpdates = false;

//"_reopenConnection" may not be the best name for this method; it
//makes sure that there's an open connection if there should be one
graph._reopenConnection = function() {
    //Reopen iff: no connections, but graph is connected, we don't already have a reopenTimeout,
    //(i.e. reopen is already scheduled) and body has loaded
    if (!this._connections.length && (this._isConnected || this._remoteHasPendingUpdates)&& 
        !this._reopenTimeout && !this._inQuietPeriod ){
        var self = this;
        var reopen = function(){ 
            //failure is acceptable for this request
            self._sendQueuedMsjs(true); 
        };

        this._reopenTimeout = setTimeout(reopen, this._reopenWaitTime);

        if (this._reopenWaitTime < 20 *1000){ //don't ever wait longer than 20 seconds
            this._reopenWaitTime *= 2; //back off retry timeout
        }
    }
}

graph._abortConnections = function() {
    for (var i=0; i < this._connections.length; i++) {
        var connection = this._connections[i];
        this._clearConnectionTimeout(connection);
        if (0 < connection.readyState && connection.readyState < 4) {
            connection.abort();
        }
    }
    this._connections.length = 0;
}

/**
    Given an object returned by {@link msjs.graph}, create the node instances
    specified by the given data, and insert into this graph. Client-only
    @param {Object} contents An object returned by {@link msjs.graph}
    @private
    @name setPackInfo
    @methodOf msjs.graph#
*/
graph.setPackInfo = function(packed){
    this.id = packed.id;
    this.clock =packed.clock;
    this.hasRemote = true;
    this._adjacencyMatrix = packed._adjacencyMatrix;
    this._tc = packed._tc;
    this._isConnected = packed._isConnected;
    this.profile = packed.profile;

    var packedNodes = packed.nodes;
    var self = this;
    //Do this in two steps, so nodes can refer to one another
    this._nodes = msjs.map(packedNodes, function(packedNode){
        var node =  msjs.require("msjs.node").rawMake();
        node.graph = self;
        return node;
    });

    msjs.each(this._nodes, function(node, n){
        node.unpack(packedNodes[n]);
    });

    //FIXME: Can this cause a race condition?
    this._remoteHasPendingUpdates = packed.hasPendingUpdates;
}

graph.start = function() {
    msjs.each(this._nodes, function(node, nid){
        if (node.onLoad) node.onLoad();
        if (node.onConnectionError) self._connectionErrorListeners.push(node);
    });
}

//Don't send requests until after the page has loaded
//This method is called from the "onload" attribute of the
//document that's rendered in document.js
graph._inQuietPeriod = false;
graph.bodyOnLoad =function(){
    var self = this;

    var gentlyCloseConnections = function(){
        var i = 0;
        while (i < self._connections.length){
            var connection = self._connections[i];
            if (connection.readyState ==3) {
                connection.abort();
                self._connections.splice(i, 1);
            } else {
                i++
            }
        }

        return self._connections.length == 0;
    }

    //this is necessary for safari/chrome
    var doQuietPeriod = function(){
        self._inQuietPeriod = true;
        if (!gentlyCloseConnections()){
            //try again
            self.setTimeout(doQuietPeriod, 1000);

            return;
        }

        self.setTimeout(function(){
            self._inQuietPeriod = false;
            self._reopenConnection();
        }, 1000);
    }


    //reopens connection if _remoteHasPendingUpdates or _isConnected
    doQuietPeriod();

    window.onbeforeunload = function(){
        self._doNotReconnect = true;
    }

}

//This allows us to mock this call on the server
graph.setTimeout = function(f, dur){
    setTimeout(f, dur);
}

/**
    Start an update with new values for the given nodes. This is the concurrency boundary
    for graph updates; only one thread may enter this method at a time, and it's an error
    to call this method from within a running update. This method is called by {@link
    msjs.node#update}.

    @param {map} map A map of node ids to new msjs for those nodes.
    @name putUpdate
    @methodOf msjs.graph#
*/
graph.putUpdate = function(update){
    this._processUpdate(update, true);

    if (this._hasQueuedUpdatesForRemote()){
        this._valve.pressurize();
    }
}

graph._hasQueuedUpdatesForRemote = function() {
    this._updateLock.lock();
    try {

        var lastQueuedUpdate = this._remoteUpdateQueue.length + this._remoteUpdateQueueOffset; 
        return lastQueuedUpdate >  this._nextUpdateNumber;
    } finally {
        this._updateLock.unlock();
    }
}

// This is guarded by _updateLock
graph._processUpdate = function(update, secure){
    //can't re-enter udpates
    if (this._updateLock.isHeldByCurrentThread()){
        msjs.log("WARNING: Ignoring re-entrant update call", this);
        return;
    }
    this._updateLock.lock();
    try {
        var tick = ++this.clock;
        var remoteUpdate = null;
        //msjs.log(update);
        for (var k in update){
            var msj = update[k];
            var node = this.getNode(k);

            //For security reasons, don't allow the client to update nodes which
            //aren't packed
            if (!secure && !msjs.isClient && node.isLocal) {
                msjs.log('Permission denied for update of', node);
                throw "Can't update server node";
            }

            var lastUpdate = node.updateMsj(msj, this.clock);
            if (node.doesRemoteUpdate && lastUpdate == tick){
                remoteUpdate = remoteUpdate || {};
                remoteUpdate[k] = msj;
            }
        }

        var sorted = this._topoSort();
        //TODO: This could just be a map of true/false rather than
        //distances, since order is provided by topoSort
        var distances = this._getMinimumDistances(update);
        //msjs.log(distances);
        for (var i=0; distances && i< sorted.length; i++){
            var nid = sorted[i];
            var dependent = this.getNode(nid);
            //msjs.log(i, dependent, distances[i]);
            if (!distances[nid]) continue;
            var lastUpdate = dependent.refreshMsj();
            if (dependent.doesRemoteUpdate && lastUpdate == tick){
                remoteUpdate = remoteUpdate || {};
                remoteUpdate[dependent.getId()] = dependent.getMsj();
            }
        }

        if (this.hasRemote && remoteUpdate){
            this._remoteUpdateQueue.push(remoteUpdate);
        }
    }finally{
        this._updateLock.unlock();
    }
}

graph.putCachedResult = function(key, value, cacheName){
    if (!this._cache[cacheName]){
        this._cache[cacheName] = {};
    }
    this._cache[cacheName][key] = value;
}
graph.getCachedResult = function(key, cacheName){
    if (!this._cache[cacheName]) return void 0;
    return this._cache[cacheName][key];
}

// @return {Array} Get node id's of dependents.
graph.getDependentsByNodeId = function(nid){
    var aj = this._adjacencyMatrix;
    var row = aj[nid];
    var dependents = [];
    for(var i=0; i< aj.length; i++){
        if (!row[i]) continue;
        dependents.push(i);
    }
    return dependents;
}


graph._topoSort = function(){
    if (!this._cache.topoSort){
        var sorted = [];
        var visitMap = {};

        var self = this;
        var visit = function(nid){
            visitMap[nid] = true;
            msjs.each(self.getDependentsByNodeId(nid), function(depNid){
                if (!visitMap[depNid]){
                    visit(depNid);
                }
            });
            sorted.push(nid);
        }

        for (var i=0; i<this._nodes.length; i++){
            if (!visitMap[i]) visit(i);
        }

        this._cache.topoSort = sorted.reverse();
    }

    return this._cache.topoSort;

}

//given a map whose keys are node ids, returns an array
//where each index is a node id and each value is the minimum
//(downstream) distance between that node and one of the 
//nodes in the map
graph._getMinimumDistances = function(map){
    var result = null;
    var didCopy = false;

    var tc = this.getTransitiveClosure();
    for (var updated in map){
        var row = tc[updated];
        if (result == null){
            result = row;
        }else{
            if (!didCopy){
                result = msjs.copy(result);
                didCopy = true;
            }

            for (var k in row){
                if (result[k]){
                    result[k] = Math.min(row[k], result[k]);
                } else{
                    result[k] = row[k];
                }
            }
        }
    }

    return result;
}

//Override
graph._getDebugName = function(){
    return "graph " + this.id;
}

graph._updateLock = {
    _locked : 0,
    lock: function(){ this._locked++ }, 
    unlock: function(){ this._locked-- } , 
    isHeldByCurrentThread : function(){ return this._locked > 0 }
};
msjs.publish(graph, "Client");

/*! msjs.server-only **/
graph._valve = msjs.require("java.org.msjs.script.Valve");

/**
    Any nodes in the graph which are mutually accessible, are participants in a
    "strong component." The handling of circular updates in 
    {@link graph.makeClean} (above) checks for strong components using
    the data returned by this function. This function is implemented using Kosaraju's
    algorithm. The result of this function is memoized
    @return {Hash of lists} For any node in the graph which participates in a strong
    component with another node, this Hash has an entry which is a list of the other 
    nodes in the component, in distance order.
    @private
    @name _getStrongComponents
    @methodOf msjs.graph#
*/
graph._getStrongComponents = function() {
    var index = 0;
    var self = this;

    var visited = [];
    var stack = [];

    var componentId = 0; // number id to assign to each strong component
    var componentOrders = [];

    // Set componentOrders with nodes that are part of a strong component.
    // Format of componentOrders looks like:
    //
    //     componentsOrders[nodeId] = { n: <componentId>, order: <orderList> }
    //
    // where orderList is the list ndoes in the strong components starting with
    // nodeId.
    // @param {Array} scc List of node id's representing a strongly-connected
    // component.
    function orderedNodesForStrongComponent(scc) {
        if (scc.length <= 1) return;

        var tc = self.getTransitiveClosure();
        for (var i=0; i < scc.length; i++){
            //find the order of update starting with the node at i
            var nid = scc[i];
            var row = tc[nid];
            var order = scc.concat();
            order.sort(function(a,b){
                var distA = a == nid ? 0 : (row[a] || 0);
                var distB = b == nid ? 0 : (row[b] || 0);
                return distA - distB;
            });
            componentOrders[nid] = {n: componentId, order: order};
        }

        componentId++;
    }

    // Described in http://algowiki.net/wiki/index.php/Tarjan%27s_algorithm.
    // See Wikipedia entry for better overall description, but inaccurate
    // pseudo-code algorithm.
    function tarjan(nid) {
        visited[nid] = {index: index, lowlink: index};
        index++;
        stack.push(nid);
        stack["n" + nid] = true; // use so we can check stack w/o iterating

        var dependents = self.getDependentsByNodeId(nid);
        for (var i=0; i < dependents.length; i++) {
            var depNid = dependents[i];
            if (!visited[depNid]) {
                tarjan(depNid);
                visited[nid].lowlink = Math.min(visited[nid].lowlink,
                                                visited[depNid].lowlink);
            } else if (stack["n" + depNid]) { // is v' in the stack?
                visited[nid].lowlink = Math.min(visited[nid].lowlink,
                                                visited[depNid].index);
            }
        }

        if (visited[nid].lowlink == visited[nid].index) {
            var scc = [];
            do {
                var stackNid = stack.pop();
                delete stack["n" + stackNid];
                scc.push(stackNid);
            } while (stackNid != nid);

            orderedNodesForStrongComponent(scc);

        }
    }
    
    for (var i=0; i < this._nodes.length; i++) {
        if (!visited[i]) tarjan(i);            
    }

    return componentOrders;
}


/**
    Call refreshMsj on all graph nodes.
    @name refreshAll
    @methodOf msjs.graph#
*/
graph.refreshAll = function(){
    var self = this;
    var bad = {};
    this._updateLock.lock();
    try{
        msjs.map(this._topoSort(), function(nid){
            var t= (new Date()).getTime();
            self.getNode(nid).refreshMsj();
            t = (new Date()).getTime() - t;
            if (t > 150){
                bad[self.getNode(nid)._getDebugName()] = t;
            }
        });
    }finally{
        this._updateLock.unlock();
    }

    for (var k in bad){
        this.profile[k] = bad[k];
    }

}

graph.profile = {};

/*
    Return this list of packed objects for this graph. This method has side-effects; 
    any node that is packed during this operation is marked as such and will not
    be packed again.
    @return {Object} A hash containing data to unpack this graph.
    name pack
    memberOf msjs.graph#
*/
graph.pack = function() {
    this._updateLock.lock();
    var r;
    try{
        r = this._pack();
    } finally {
        this._updateLock.unlock();
    }
    return r;
}

// This is unsynchronized. It shouldn't be run w/o protection from _pack.
graph._pack = function(){
    if (this.hasRemote){
        throw "Graph was already packed! " + this.id;
    }
    this._assertNoStrongComponents();

    var t = (new Date()).getTime();

    var packMap = {};
    var self = this;
    msjs.each(this._topoSort(), function(nid){
        var node = self.getNode(nid);
        //every node gets refreshed
        node.packMe = self._determinePack(node); 
        if (node.packMe) packMap[nid] = true;
    });

    for (var nid in packMap){
        this._wantToPack(this.getNode(nid), packMap);
    }

    //nodes that have dependents that are packed
    var cacheMap = {};
    //nodes that have dependents that are not-packed
    var remoteUpdaters = {};

    msjs.each(this._nodes, function(node){
        var relevantMap = packMap[node.getId()] ? cacheMap : remoteUpdaters;
        msjs.each(node.getInputs(), function(dependencyId){
            relevantMap[dependencyId] = true;
        });
    });

    var nodes = [];

    //list of scopes
    var scopeList = [];
    //list of list of functions for each scope
    var scopeFunctions = [];

    msjs.map(this._nodes, function(node){
        var nid = node.getId();
        var packed = null;

        var packType = "notPacked";
        if (packMap[nid]){
            packType = "packed";
        } else if (cacheMap[nid]){
            packType = "cached";
        }

        packed = node.pack(packType);


        if (remoteUpdaters[nid] && packType == "packed"){
            packed.doesRemoteUpdate = true;
        }

        nodes.push(packed);
    });

    this.hasRemote = true;
    this.profile.packTime = (new Date()).getTime() - t;
    return {
        nodes : nodes, 
        id : this.id,
        _isConnected : this._isConnected,
        clock : this.clock,
        profile : this.profile,
        _adjacencyMatrix : this._adjacencyMatrix,
        _tc : this.getTransitiveClosure(),
        hasPendingUpdates : this._hasPendingUpdates()
    };
}

graph._assertNoStrongComponents = function() {
    var sc = this._getStrongComponents();
    if (! sc.length) return;

    var done = {};
    for (var k in  sc) {
        var component = sc[k];
        if (!done[component.n]) {
            this._printStrongComponent(component);
            done[component.n] = true;
        }
    }
    throw "Found a strong component; see log for details";
};

graph._printStrongComponent = function(component){
    msjs.log("digraph strongComponent"+ component.n + "{");
    for (var i=0; i < component.order.length; i++) {
        var node = this._nodes[ component.order[i] ];
        msjs.log('"' + node._getDebugName() + '"[fillcolor=gray70,style=filled];');
        msjs.log(this._printDependencies(node));
    }
    msjs.log("}");
}

graph._printDependencies = function(node){
    var out = "";
    var dependencies = this.getDependencies(node);
    msjs.each(dependencies, function(sourceNode){
        out += '"' + sourceNode._getDebugName() + '" -> "' + node._getDebugName() + '";\n';
    });

    return out;
}

graph.getPackInfo = function(){
    return this.pack();
}

graph._determinePack = function(node){
    if (node.packMe != null) return node.packMe;
    if (node.onLoad || node.onConnectionError) return true;

    //default to packing nodes
    return msjs.isPackable(node) != false;
}

graph._msjs_isPackable = function(){
    return null;
}

graph._wantToPack = function(node, packMap){
    var nid = node.getId();
    if (node.packMe == false || packMap[nid]) return;
    packMap[nid] = true;
    for (var k in this._adjacencyMatrix[nid]){
        this._wantToPack(this._nodes[k], packMap);
    }
}

graph.needsMsjPack = function(nid){
    for (var k in this._adjacencyMatrix[nid]){
        var dependent = this._nodes[k];
        if (dependent.needsCachedMsj(nid)) return true;
    }

    return false;
}

graph.async = function(callback){
    this._updateCounter.incrementAndGet();
    var self = this;
    var runnable = new java.lang.Runnable({
        run : function(){
            try{
                callback();
            } catch(e){
                if (e.javaException &&
                    e.javaException instanceof java.lang.InterruptedException){
                    //ignore
                } else{
                    var message = e.message || (e.getMessage && e.getMessage() ) || e;
                    msjs.log('async update error:', message);
                    msjs.log('while running', callback);
                }
            } finally{
                self._updateCounter.decrementAndGet();
            }
        }
    });
    return msjs.getExecutor().submit(runnable);
}
graph._updateCounter = new java.util.concurrent.atomic.AtomicInteger();
graph._updateLock = new java.util.concurrent.locks.ReentrantLock();
graph._hasPendingUpdates = function(){
    return this._updateCounter.get() > 0;
}

graph.shutdown = function(){
    //Let any waiting request go
    this._valve.pressurize();
    msjs.each(this._nodes, function(node){
        node.shutdown();
    });
}

graph._getTC = msjs.require("msjs.gettc");
graph.getTransitiveClosure = function(){
    return this._getTC(this._adjacencyMatrix);
}

//this mocked for tests, but it doesn't actually call back later
graph.setTimeout = function(f, dur){
    f();
}
