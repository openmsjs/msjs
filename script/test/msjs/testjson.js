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
//string values must be double quoted; test escaping too
assert(msjs.toJSON("a'\"String") == "\"a'\\\"String\"");

//serialize java strings as strings
var javaString = new java.lang.String("javaString");
assert(msjs.toJSON(javaString) == "\"javaString\"");

//throw when handed a java object
var failed = false;
try{
    var javaObject = new java.lang.Object;
    msjs.toJSON(javaObj);
}catch (e){
    failed = true;
}
assert(failed);

//throw when probably caught in a cycle
var a = {};
var b = {};
a.b = b;
b.a = a;
failed = false;
try{
    msjs.toJSON(a);
}catch(e){
    failed = true;
    assert(e.toString().indexOf( "Max depth" ) == 0);
}
assert(failed);
