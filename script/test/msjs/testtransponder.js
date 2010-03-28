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
var input = msjs();
var receiver = msjs();
receiver.set("input", input);

var output = [];

var latch = new java.util.concurrent.CountDownLatch(1);
receiver.produceMsj = function(msj){
    latch.countDown();
    output.push(msj.input);
}

msjs.require("msjs.transponder").set("message", input);

var otherContext = msjs.require("java.org.msjs.script.MsjsScriptContext");
otherContext.bindings.othergraphid = msjs.require("msjs.graph").id;
var sender = otherContext.loadPackage("test.msjs.includes.transponder");

assert(output.length == 0);
sender.update("hi");
latch.await();
assert(output.length == 1);
assert(output[0] == 'hi');
