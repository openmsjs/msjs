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

connection.make = function(getRecipientIds){
    var c = new connectionConstructor();
    c.getRecipientIds = getRecipientIds;

    //map of graph ids to connectors
    //TODO: tweak settings
    c.connectorMap = maker.weakValues().makeMap();

    return c;
};

//abstract
connection.getRecipientIds = function(){
    return msjs.THE_EMPTY_LIST;
}

connection._msjs_isPackable = function(){
    return false;
}

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
}

connection.getAllConnected = function(){
    return this.connectorMap.keySet();
}

connection.handle = function(node){
    var recipientIds = this.getRecipientIds(node);
    var id = node.graph.id;
    var msj = node();
    var connectorMap = this.connectorMap;

    msjs.execute( new java.lang.Runnable({
        run : function(){
            msjs.each(recipientIds, function(recipientId){
                if (recipientId == id) return;
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
        }
    }));
}

connection._getDebugName = function(){
    return "msjs.connection";
}
