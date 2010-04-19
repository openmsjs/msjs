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

var aNode = msjs(function(){return null;});
assert(aNode.getId() != null);

var bCount =0;
var bNode = msjs(function(){return bCount++;});

var cCount =0;
var cNode = msjs(function(){return cCount++;});

bNode.depends(aNode);
cNode.depends(bNode);
msjs.require("msjs.graph").refreshAll();

assert(bNode() == 0);
//call it again to make sure result is cached
assert(bNode() == 0);
assert(cNode() == 0);

aNode.update();
assert(bNode() == 1);
assert(cNode() == 1);
