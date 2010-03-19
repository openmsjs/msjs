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

var aCount = 0;
var aNode = msjs.make(function(){
    return aCount++;
}); 

var bNode = msjs.make(function(){
    return "b";
}); 

var aModel =msjs.make(function(msj){
    return msj;
});

aModel.set(0, aNode);
aModel.set(1, bNode);
aNode.refreshMsj();
bNode.refreshMsj();
aModel.refreshMsj();

var msj = aModel.getMsj();
assert(msj[0] == 0);
assert(msj[1] == 'b');
