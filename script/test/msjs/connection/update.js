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

var server = msjs().setPack(false);
var input = msjs.mock("input", function(data){
    server.update(data);
});

var client = msjs( function(msj){
    msjs.log('re', server());
    return server();
}).depends(server).setPack(true);

var listener = msjs( function(msj){
    msjs.log('li', client());
    return client();
}).depends(client).setPack(false);

var output = msjs.mock("output", []);
var display = msjs( function(msj){
    output.push(listener());
    msjs.log(output);
}).depends(listener).setPack(true);
