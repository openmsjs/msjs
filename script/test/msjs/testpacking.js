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

//test graph packing
function countProperties(packed){
    var propcount =0;
    for (var k in packed){
        propcount++;
        //msjs.log(k, packed[k]);
    }
    return propcount;
}
var msjF = function(x){return x};

var packed;

var packedNode = msjs.make(msjF);
packed = packedNode.pack("packed");
//three properties, id, unpacker, and msjF
assert(countProperties(packed) == 2);

assert(packed != null);
//produceMsj should be packed as a reference to a closure
assert(typeof packed.produceMsj == 'object');
assert(packed.produceMsj._msjs_Packed != null);

var notPackedNode = msjs.make(msjF);
packed = notPackedNode.pack("notPacked");
assert(packed != null);
assert(packed._msjF == null);
//id, packer, and isPresent
assert(countProperties(packed) == 2);


var packedModel = msjs.make(msjF);
packedModel.set("channel", packedNode, true);
packed = packedModel.pack("packed");
//five properties: id,  packer, msjF, _inputs, _transient
assert(countProperties(packed) == 4);
assert(packed._inputs.channel == packedNode.getId());
assert(packed._transient.channel == true);

var notPackedModel = msjs.make(msjF);
packed = notPackedModel.pack("notPacked");
assert(packed != null);
assert(packed._msjF == null);
//id and isPresent
assert(countProperties(packed) == 2);


//TODO: test that unpacker property is set correctly by
//calling graph pack function
