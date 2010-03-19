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
var input = context.bindings.input;
var output = context.bindings.output;

var graph = context.bindings["msjs.graph"];
var packed = graph.pack();

var initial = graph.getMsjForRemote();
assert(initial.updateQueue.length == 0);
assert(initial.updateQueueOffset == 0);

input("first");
input("second");
var twoUpdates = graph.getMsjForRemote();
assert(twoUpdates.updateQueueOffset == 0);
assert(twoUpdates.updateQueue.length == 2);
assert(twoUpdates.updateQueue[0]['0'] == 'first');
assert(twoUpdates.updateQueue[1]['0'] == 'second');

input("third");
var thirdOnly = graph.getMsjForRemote();
assert(thirdOnly.updateQueueOffset == 2);
assert(thirdOnly.updateQueue.length == 1);
assert(thirdOnly.updateQueue[0]['0'] == 'third');

//now simulate the client missing updates
graph.acceptMsjFromRemote({
    acknowledgeUpdate: 0,
    updateQueueOffset : 0,
    updateQueue : []
});

var resend = graph.getMsjForRemote();
assert(resend.updateQueueOffset == 0);
assert(resend.updateQueue.length == 3);
assert(resend.updateQueue[0]['0'] == 'first');
assert(resend.updateQueue[1]['0'] == 'second');
assert(resend.updateQueue[2]['0'] == 'third');
