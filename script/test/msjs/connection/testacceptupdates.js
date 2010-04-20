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

var assert = msjs.require("msjs.assert");
var context = msjs.require("java.org.msjs.script.MsjsScriptContext");
context.loadPackage("test.msjs.connection.update");
var graph = context.bindings["msjs.graph"];
graph.pack();
var input = context.bindings.input;
var output = context.bindings.output;

var initial = graph.getMsjForRemote();
assert(initial.updateQueue.length == 0);
assert(initial.updateQueueOffset == 0);

//make sure a simple update works
msjs.log('start');
input('x');
var updated = graph.getMsjForRemote();
assert(updated.updateQueueOffset == 0);
msjs.log(updated);
assert(updated.updateQueue.length == 1);
//first update, node zero
assert(updated.updateQueue[0]['0'] == 'x');

//Now simulate a missed update from the client
graph.acceptMsjFromRemote({
    acknowledgeUpdate : 1, //should be graph's last update
    updateQueueOffset : 1,
    updateQueue : [{
        "1": "second update" //update for node 1
    }]
});

var missed = graph.getMsjForRemote();  
assert(missed.acknowledgeUpdate == 0);
assert(missed.updateQueueOffset == 1);
assert(missed.updateQueue.length == 0);

//Now the client calls back with the correct updates
graph.acceptMsjFromRemote({
    acknowledgeUpdate : 1, //should be graph's last update
    updateQueueOffset : 0,
    updateQueue : [{
        "1": "first update"
    },{
        "1": "second update"
    }]
});

var accepted = graph.getMsjForRemote();  
assert(accepted.acknowledgeUpdate == 2);
assert(accepted.updateQueueOffset == 1);
assert(accepted.updateQueue.length == 2);
assert(accepted.updateQueue[0]['2'] == 'first update');
assert(accepted.updateQueue[1]['2'] == 'second update');
