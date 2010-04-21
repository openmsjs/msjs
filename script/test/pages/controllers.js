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

/** Test two buttons **/
var dom = msjs.require("msjs.dom");
var buttons = $(
<div>
    This test makes sure that controller messages are transient.<br/>
    Pressing the buttons should only ever make the output read 'one' or 'two' but never onetwo<br/>
    <div>
        <button value="one">one</button>
        <button value="two">two</button>
    </div>
</div>
).appendTo("body");

var twoButtons = msjs()
$('button').click(function(event) {
    twoButtons(event.target.value);
});

var outputEl = $(<p>[no message]</p>).appendTo("body");
var output = msjs(function(msj){
    outputEl.text(twoButtons());
}).depends(twoButtons);

/** Test checkboxes **/
$( <form style="margin-top:50px"><div>
            <input type="checkbox" value="C"/>C
            <input type="checkbox" value="A" checked="checked"/>A
            <input type="checkbox" value="T" checked="checked"/>T
    </div></form>
).appendTo("body").click(
    function() { 
        checks.update();
    }
);

var checks = msjs(function(){
    var s = "";
    var inputs = $("input").each(function(i, input){
        if (input.checked) s += input.value;
    });
    return s;
});
//checks.dirty = true;

var output2El = $(<p/>).appendTo("body");
var out = msjs(function(msj){
    output2El.text(checks());
}).depends( checks);
