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
var listEl = dom.add(<div/>);
var sortKey = "first";
var list = msjs.make( function(msj){
    if (msj.toggle) sortKey = sortKey == "first" ? "last" : "first";

    var arr = [
        { first : "alan", last: "zerta"},
        { first : "bob", last: "yolo"},
        { first : "candy", last: "xanthen"},
        { first : "donna", last: "winter"}
    ];

    for (var i=0; i< arr.length; i++){
        arr[i].id = i;
    }


    arr.sort(function(a,b){
        var aName = a[sortKey];
        var bName = b[sortKey];
        return aName < bName ? -1 : 1;
    });

    //this is append only
    for (var i=0; i < arr.length; i++){
        if (!listEl.childNodes[i]){
            listEl.appendChild(document.createElement("div"));
        }
        dom.setText(arr[i].first + " " + arr[i].last, listEl.childNodes[i]);
    }

    return arr;
});
list.dirty = true;



var controls = dom.handle("onclick", dom.add(
    <div>
        <input type="button" value="toggle"/>
    </div>
),"input", function(event){
    return true;
});
list.set("toggle", controls);
