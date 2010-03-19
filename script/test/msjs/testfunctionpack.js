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

var a = true;
var f = function(){
    return a;
}

var n = msjs.make(function(){
    return f();
});
n.packMe = true;

msjs.require("msjs.graph").pack();

var scopes = eval(msjs.getPackInfo());

//Last function on scopes list is the values getter
var scopeValues = (scopes.pop());
//should be only one scope

var scope = (scopes[0]).apply(this, (scopeValues[0])());
var nProduce = scope[0];

var assert = msjs.require("msjs.assert");
//Make sure that f is bound in the packed produce function
//This will error if f is not bound within the packed version
//of n's produce method
assert(nProduce());
