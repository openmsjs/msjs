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

var x = 1;
var y = {z:2};

var dom = msjs.require("msjs.dom");
var button = dom.add(<button>click me</button>); 
var b = dom.handle("onclick", button, function(event){
    return true;
});

var m = msjs.make(function(msj){
    y.z++;
    return x++;
});

m.depends(b);

var output = dom.add(<div>go ahead</div>);
var d = msjs.make( function(msj){
    dom.setText(msj.m + y.z, output);
});
d.set("m", m);

