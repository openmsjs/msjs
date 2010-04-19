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

var a = msjs(function(){
    return "a";
});

var b = msjs(function(){
    return "b";
});

var c  = msjs(function(){return null;});
var result = msjs(function(){
    if (a.isUpdated()) return a();
    if (b.isUpdated()) return b();
    return "none";
}).depends(a,b,c);

msjs.require("msjs.graph").refreshAll();

var assert = msjs.require("msjs.assert");
assert(result() == 'a');

b.update();
assert(result() == 'b');

c.update();
assert(result() == 'none');
