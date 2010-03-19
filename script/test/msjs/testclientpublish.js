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

var a = msjs.require("test.msjs.clientpublish.a");
var b = msjs.require("test.msjs.clientpublish.b");

var n = msjs.make(function(){
    //make sure to close over the values so they're packed
    return a == b.a;
});
n.packMe = true;
msjs.require("msjs.graph").pack();

var scopes = eval(msjs.getPackInfo());
//Last function on scopes list is the values getter
var scopeValues = scopes.pop();
//should be only one scope
var freeValues = (scopeValues[0])();

var assert = msjs.require("msjs.assert");
assert(freeValues.indexOf(a) > -1);
assert(freeValues.indexOf(b) > -1);

assert("freeValues contains clientpublish.a", freeValues.indexOf(a) > -1);
assert("freeValues contains clientpublish.b", freeValues.indexOf(b) > -1);

var packList = msjs.clientPackages
assert("clientpublish.a is in clientPackages", 
        packList.indexOf("test.msjs.clientpublish.a") > -1 );
assert("clientpublish.b is in clientPackages", 
        packList.indexOf("test.msjs.clientpublish.b") > -1 );

assert("order of client publish is correct", 
        packList.indexOf("test.msjs.clientpublish.a") < 
        packList.indexOf("test.msjs.clientpublish.b"));
