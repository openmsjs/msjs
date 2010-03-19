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

var dom = msjs.require("msjs.dom");
var listEl =  dom.add(<div/>);
var list = msjs.make( function(msj){
    var model = msj.model;
    //append only
    for (var i=0; i < model.length; i++){
        if (!listEl.childNodes[i]){
            var name = model[i].first + " " + model[i].last;
            var el = listEl.appendChild(document.createElement("div"));
            dom.setText(name, el);
            el.style.border = "solid 1px black";
            el.style.padding = "5px";
            el.style.width = "125px";
        }
    }
});

var model = msjs.make(function(msj){
    if (msj.form && msj.form.first){
        this._msj.push(msj.form);
    }
    return this._msj;
});
model.packMe = false;
model.dirty = true;

model._msj = [
    {first : "abbie", last : "guggenheim"},
    {first : "bobby", last : "hiliard"},
    {first : "charlie", last : "ilkilkicker"}
];


list.set("model", model);

var form = dom.add(
    <form><div>
        <input type="text" name="first"/>
        <input type="text" name="last"/>
        <input type="submit" value="go"/>
    </div></form>
);

var submit = dom.handle("onsubmit", form, function(event){
    var r = {
        first : form.first.value,
        last : form.last.value
    };

    form.reset();
    form.first.focus(); //:)
    return r;
});

model.push(submit, "form");

/*
var nodes = msjs.node._graph._nodes;
for (var i=0; i < nodes.length; i++){
    msjs.log(i, nodes[i] );
}

var tc = msjs.node._graph.getTransitiveClosure();
for (var i =0; i<tc.length; i++){
    msjs.log(tc[i]);
}
*/
