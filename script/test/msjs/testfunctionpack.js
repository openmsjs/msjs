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

var n = function(){
    return f();
};

n.x = 4;
n.y = function(){return 44;};

var packedN = msjs.pack(n);

//Test references to self
var  name1 = name2 = function(){ 
    return name1 == name2 && name1 == arguments.callee;
}

var packedNamed = msjs.pack(name1);

var packInfo = eval(msjs.getPackInfo());
msjs.setPackInfo(packInfo);
packedN = msjs.unpack(packedN);
packedNamed = msjs.unpack(packedNamed);

var assert = msjs.require("msjs.assert");
//Make sure that f is bound in the packed produce function
//This will error if f is not bound within the packed version
//of n's produce method
assert("functions are packed with free variables", packedN());
assert("literal function members",packedN.x == 4);
assert("function function members",packedN.y() == 44);

assert("free variable synonyms", packedNamed());
