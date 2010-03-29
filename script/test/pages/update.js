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

var animator = msjs.require("msjs.animator");

var jForm = $(
    <form><div>
        <input type="radio" name="size" value="longer" checked="checked"/> longer
        <input type="radio" name="size" value="shorter"/> shorter <br/>
        <input type="radio" name="sort" value="alpha" checked="checked"/> alpha
        <input type="radio" name="sort" value="friendliness"/> friendliness <br/>
        <input type="submit" value="go"/>
    </div></form>
).appendTo(document.body);

var form = jForm.get(0);

var controls = msjs( function(){
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

jForm.submit(function() {
    controls.update();
});

        
var dom = msjs.require("msjs.dom");
var listEl = $(<div style="position:relative"/>).appendTo("body");
var elHeight = 30;
var list = msjs( function(msj){
    var model = msj.model;
    var self = this;
    //hide them all to start
    listEl.find("div").each(function(i, animal) {
        animal.style.display = "none";
    });

    //map animals
    var animalMap = {};
    $.each(listEl.children(), function(n, el){
        animalMap[$.data(el, "name")] = el;
    });


    msjs.each(model, function(animal,i){
        var name = animal.name;
        var el = animalMap[name];
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
    var el = $("<div/>").appendTo(listEl)
        .css({width : "200px", 
              padding : "5px",
              border : "solid 1px",
              position :  "absolute",
              height :  "20px",
              top :  (n*elHeight)+"px"})
        .text(name);

    $.data(el[0], "name", name);
}

var animals = msjs(function(){
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

var model = msjs(function(msj){
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
