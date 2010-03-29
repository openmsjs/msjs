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
var make = function(l){
    return msjs(function(){return l;});
}

var a = make("a");
var b = make("b");
var c = make("c");

msjs.require("msjs.graph").refreshAll();

c.set("a", a);
c.set("b", a, true);

var packA = a.pack("cached");
var packB = b.pack("cached");

assert(packA._msj == 'a');
assert(packB._msj === void 0);
