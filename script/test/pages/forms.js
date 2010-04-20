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

var el = $(<div>
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

var input = el.find("input").first();
var form = el.find("form");

var clearButton = msjs( el.find("button"), "click", function(){
    input.val("");
    form[0].reset();
    return true;
});

var typing = msjs(function(){
    return input.val() || "";
});
typing.depends(clearButton);

input.keyup( function(){
    typing.update();
});

var submit = msjs(function(){
    //TODO: Can't use normal form[named input] here, since that's not
    //implemented on the server in msjs (yet!)
    var values = {};
    form.find("input").each(function(n, el){
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

form.submit(function(){
    submit.update();
});


var out = $(<div/>).appendTo(document.body);
var view = msjs(function(){
    out.children().remove();

    var updates = {
        "input": typing(),
        "clearButton": clearButton.isUpdated ? clearButton() : void 0,
        "form": submit()
    }

    for (var k in updates){
        if (updates[k] === void 0) continue;
        out.append($("<pre>"+k+"<>").text( k.toUpperCase() + ": " + msjs.toJSON(updates[k]) ));
    }

}).depends(typing, clearButton, submit);
