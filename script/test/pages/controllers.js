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

var buttonsEl = dom.add(
<div>
    This test makes sure that controller messages are transient.<br/>
    Pressing the buttons should only ever make the output read 'one' or 'two' but never onetwo<br/>
    <div msj="buttons">
        <button value="one">one</button>
        <button value="two">two</button>
    </div>
</div>
);

//makes sure that output node updates
var twoButtons = dom.handle("onclick", buttonsEl, "button", function(event, hitButton){
    return hitButton.value;
});

var outputEl = dom.add(<p>[no message]</p>);

var output = msjs.make(function(msj){
    dom.setText(msj.model, outputEl);
});

output.set("model", twoButtons);

/** Test checkboxes **/
var checksEl = dom.add(
    <form style="margin-top:50px"><div>
        <input type="checkbox" value="C"/>C
        <input type="checkbox" value="A" checked="checked"/>A
        <input type="checkbox" value="T" checked="checked"/>T
    </div></form>
);

var updateChecks = dom.handle("onclick", checksEl, function(){
    return true;
});

var checks = msjs.make(function(){
    var inputs = checksEl.getElementsByTagName("input");
    s = "";
    msjs.each(inputs, function(input){
        if (input.checked) s += input.value;
    });

    return s;
});
checks.depends(updateChecks);
checks.dirty = true;

var output2El = dom.add(<p/>);
var out = msjs.make(function(msj){
    dom.setText(msj.model, output2El);
});

out.set("model", checks);
