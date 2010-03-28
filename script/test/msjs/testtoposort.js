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

var node = msjs.require("msjs.node");
//construct out of order
var c = msjs();
var b = msjs();
var e = msjs();
var a = msjs();
var d = msjs();

b.depends(a);
c.depends(a);
c.depends(b);
d.depends(c);
d.depends(a);
e.depends(c);
e.depends(d);

var graph = msjs.require("msjs.graph");
var sorted = graph._topoSort();
var assert = msjs.require("msjs.assert");
assert(a == graph.getNode(sorted[0]));
assert(b == graph.getNode(sorted[1]));
assert(c == graph.getNode(sorted[2]));
assert(d == graph.getNode(sorted[3]));
assert(e == graph.getNode(sorted[4]));
