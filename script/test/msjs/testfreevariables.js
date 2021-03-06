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
var a =true, b=true, freeVars;

var f1 = function(x, y){
    var z;
    return a+b+x+y+z;
};
freeVars = msjs.context.getFreeVariables(f1);
assert(freeVars.a);
assert(freeVars.b);
assert(!freeVars.x);
assert(!freeVars.y);
assert(!freeVars.z);


var c = true;
var f2 = function(msj){
    var z =c;
    var f1= function  (){ 
        var x=a;
        var f2 = function(){
            var y=b;
        };
    };
};
freeVars = msjs.context.getFreeVariables(f2);
assert(freeVars.a);
assert(freeVars.b);
assert(freeVars.c);
assert(!freeVars.x);
assert(!freeVars.y);
assert(!freeVars.z);

freeVarsWithNative = msjs.context.getFreeVariables(function(){
    x = String;
});

assert(freeVarsWithNative.String == String);
