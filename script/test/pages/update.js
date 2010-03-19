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
var animator = msjs.require("msjs.animator");

var form = dom.add(
    <form><div>
        <input type="radio" name="size" value="longer" checked="checked"/> longer
        <input type="radio" name="size" value="shorter"/> shorter <br/>
        <input type="radio" name="sort" value="alpha" checked="checked"/> alpha
        <input type="radio" name="sort" value="friendliness"/> friendliness <br/>
        <input type="submit" value="go"/>
    </div></form>
);

var controls = msjs.make( function(){
    var inputs = form.getElementsByTagName("input");
    var r = {
        size : "shorter",
        sort : "alpha"
    };

    msjs.each(inputs, function(input){
        if (input.type == "radio" && input.checked){
            r[input.name] = input.value;
        }
    });

    return r;
});

dom.addListener("onsubmit", form, function(){
    controls.update();
});

        
var listEl = dom.add(<div style="position:relative"/>);
var elHeight = 30;
var list = msjs.make( function(msj){
    var model = msj.model;
    var self = this;
    //hide them all to start
    msjs.each(listEl.getElementsByTagName("div"), function(animal){
        animal.style.display = "none";
    });
    msjs.each(model, function(animal,i){
        var name = animal.name;
        var el = dom.findMsj(listEl, name);
        if (!el) {
            makeAnimal(name, i);
        } else {
            //show the ones that are still present
            el.style.display = "";
            var start = Number(el.style.top.substring(0, el.style.top.length-2));
            animator.make(400, function(val){
                var p = val/100;
                el.style.top = (start - p*start + p* i * elHeight) + "px";
            });
        }
    });
});

var makeAnimal = function(name, n){
    var el = listEl.appendChild(document.createElement("div"));
    dom.setText(name, el);
    dom.setDomMsj(name, el);
    el.style.width = "200px";
    el.style.padding = "5px";
    el.style.border = "solid 1px";
    el.style.position =  "absolute";
    el.style.height  =  "20px";
    el.style.top    =  (n*elHeight)+"px";
}

var animals = msjs.make(function(){
    return [{
        name :"tiger",
        friendliness : 1
    },{
        name :"polar bear",
        friendliness : -2
    },{
        name :"shark",
        friendliness : -1
    },{
        name :"puppy",
        friendliness : 4
    },{
        name :"elephant",
        friendliness : 2
    }];
});

var model = msjs.make(function(msj){
    var control = msj.control;
    var r = [];
    var l = control.size == "longer" ? 5 : 3;
    for (var i=0; i<l; i++){
        r.push(msj.model[i]);
    }

    var sortF;
    if (control.sort == "alpha"){
        sortF = function(a,b){return a.name < b.name ? -1 : 1;};
    } else {
        sortF = function(a,b){return a.friendliness > b.friendliness ? -1 : 1;};
    }
    r.sort(sortF);
    return r;
});

model.set("model", animals);
list.set("model", model);

model.set("control", controls);
