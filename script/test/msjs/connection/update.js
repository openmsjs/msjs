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

//this is used by test.msjs.testupates
var server = msjs();
server.packMe = false;
var input = function(data){
    server.update(data);
}
msjs.mock("input", input);

var client = msjs( function(msj){
    return msj.server;
});
client.set("server", server);
client.packMe = true;

var listener = msjs( function(msj){
    return msj.client
});
listener.set("client", client);
listener.packMe = false;

var display = msjs( function(msj){
    output.push(msj.listener);
});
var output = [];
msjs.mock("output", output);
display.packMe = true;
display.set("listener", listener);
