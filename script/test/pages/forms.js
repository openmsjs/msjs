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

msjs.require("jquery");
var dom = msjs.require("msjs.dom");
var jEl = $(<div>
        <button style="margin-bottom:20px">clear</button><br/>
        <input/>
        <form style="margin-bottom:20px;margin-top:20px"><div>
            <input name="check" type="checkbox"/> check 
            <input name="text" type="text" value="starting value"/>
            <input name="rad" type="radio" value="one"/> one
            <input name="rad" type="radio" value="two"/> two
            <input name="go" type="submit" value="go"/>
        </div></form>
</div>).appendTo(document.body);

var jInput = jEl.find("input").first();
var jForm = jEl.find("form");
var input = jInput.get(0);
var form = jForm.get(0);
var el = jEl[0];

var clearButton = msjs.make();

var x = jEl.find("button").click(function(){
    jInput.val("");
    jForm[0].reset();
    clearButton.update(true);
});

var typing = msjs.make(function(){
    return input.value || "";
});
typing.depends(clearButton);

jInput.keyup( function(){
    typing.update();
});

var submit = msjs.make(function(){
    //TODO: Can't use normal form[named input] here, since that's not
    //implemented on the server in msjs (yet!)
    var values = {};
    jForm.find("input").each(function(n, el){
        var name = el["name"];
        if (!name) return;
        switch (el["type"]){
            case "checkbox":
                values[name] = !!el.checked;
                break;
            case "text":
                values[name] = el.value;
                break;
            case "radio":
                if (el.checked){
                    values[name] = el.value;
                } else if (values[name] === void 0) {
                    //always make a slot for radio values, even if none is selected
                    values[name] = null;
                }
                break;
        }
    });
    return values;
});
submit.depends(clearButton);

jForm.submit(function(){
    submit.update();
});


var out = $(<div/>).appendTo(document.body);
var view = msjs.make(function(msj){
    out.children().remove();

    for (var k in msj){
        if (msj[k] === void 0) continue;
        out.append($("<pre>"+k+"<>").text( k.toUpperCase() + ": " + msjs.toJSON(msj[k]) ));
    }

});
view.set("input", typing);
view.set("clearButton", clearButton, true);
view.set("form", submit);
