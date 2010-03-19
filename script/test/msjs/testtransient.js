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

var a = msjs.make(function(){
    return "a";
});

var b = msjs.make(function(){
    return "b";
});

var result = msjs.make(function(msj){
    if (msj.a) return msj.a;
    if (msj.b) return msj.b;
    return "none";
});

result.set("a", a, true);
result.set("b", b, true);

var c  = msjs.make(function(){return null;});
result.set("c", c);

a.refreshMsj();
b.refreshMsj();
c.refreshMsj();
result.refreshMsj();

var assert = msjs.require("msjs.assert");
assert(result.getMsj() == 'a');

b.update();
assert(result.getMsj() == 'b');

c.update();
assert(result.getMsj() == 'none');
