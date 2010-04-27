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
var connectionConstructor = function(){};
var connection = msjs.publish(connectionConstructor.prototype);

var maker = new Packages.com.google.common.collect.MapMaker();

/**
    Connections allow similar nodes in different graphs to pass a msj to one
    another. Connections are usually constructed with a call to {@link msjs#connection} 
    and published in the Global namespace.
    @class A channel for sharing messages between graphs
    @name msjs.connection
*/

/**
    Construct a new connection, using the supplied function as the 
    {@link msjs.connection#getRecipientIds} function
    @methodOf msjs.connection
    @name make
    @param {Function} getRecipientIds The {@link msjs.connection#getRecipientIds} function
    for the new connection
    @return {msjs.connection} The new connection
*/
connection.make = function(getRecipientIds){
    var c = new connectionConstructor();
    c.getRecipientIds = getRecipientIds;

    //map of graph ids to connectors
    //TODO: tweak settings
    c.connectorMap = maker.weakValues().makeMap();

    return c;
};

/**
    The method which is called when a new message is received over the connection. It
    should return list of graphs in which to relay the msj, as identified by their 
    {@link msjs#id}. This method is defined on the class to return an empty list, but it
    is over-riden with the function passed to {@link msjs.connection.make}
    @methodOf msjs.connection#
    @name getRecipientIds
    @param {msjs.node} node The {@link msjs.node} which was updated. This node can
    be called to get the msj just sent by the node.
    @return {Array[String]|Iterable[String]} The list of graph.id's whose node
    should receive the msj over the connection. This can be a javascript list or a java 
    collection since it is used within a call to {@link msjs#each} by the connection.
*/
connection.getRecipientIds = function(node){
    return msjs.THE_EMPTY_LIST;
}

connection._msjs_isPackable = function(){
    return false;
}

/**
    Add a given node to the connection. Only one node from a given graph can be added
    to a single connection, though it's fine for a single graph to have multiple connections
    for different nodes
    @methodOf msjs.connection#
    @name add
    @param {msjs.node} node The {@link msjs.node} to add to this connection
    @return {msjs.connection} this
*/
connection.add = function(node){
    var self = this;

    //be sure to make listener node in correct graph
    var graph = node.graph;
    graph.setConnected();
    var connector = graph.make(function(){
        self.handle(node);
    });

    //TODO: chain these
    connector.depends(node);

    connector.putMsj = function(msj){
        var update = {};
        //avoid circular update by making sure the connector doesn't
        //get triggered by its dependency on the node
        update[this.getId()] = null;
        update[node.getId()] = msj;
        graph.putUpdate(update);
    }

    connector._setDebugInfo("_msjs_connector");

    var connectorMap = this.connectorMap;
    connectorMap.put(graph.id, connector);

    connector.shutdown = function(){
        connectorMap.remove(graph.id);
    }

    return connection;
}

/**
    Get the collection of all {@link msjs#id}'s that are listening on this connection. Although
    to a single connection, though it's fine for a single graph to have multiple connections
    for different nodes
    @methodOf msjs.connection#
    @name getAllConnected
    @param {msjs.node} node The {@link msjs.node} to add to this connection
    @return {Iterable[String]} The collection of all graph ids that are active and listening
    on this connection.
*/
connection.getAllConnected = function(){
    return this.connectorMap.keySet();
}

connection.handle = function(node){
    var recipientIds = this.getRecipientIds(node);
    var id = node.graph.id;
    var msj = node();
    var connectorMap = this.connectorMap;

    msjs.each(recipientIds, function(recipientId){
        if (recipientId == id) return;
        msjs.execute( function(){
            try {
                connectorMap.get(recipientId).putMsj(msj);
            } catch (e){
                var errorMsg = 'Error in connection send';
                if (e.rhinoException){
                    msjs.context.log(errorMsg, e.rhinoException);
                } else {
                    msjs.log(errorMsg, e);
                }
            }
        });
    });
}

connection._getDebugName = function(){
    return "msjs.connection";
}
