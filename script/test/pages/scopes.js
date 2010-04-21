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

var b = msjs();
$(<button>click me</button>).appendTo("body").click(function(event){
    b(true);
});

var m = msjs(function(msj){
    y.z++;
    return x++;
});

m.depends(b);

var output = $(<div>go ahead</div>).appendTo("body");
var d = msjs(function(msj){
    output.text(msj.m + y.z);
});
d.set("m", m);

