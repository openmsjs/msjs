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
var header = document.body.appendChild(dom.make(<h1/>));
var form = document.body.appendChild(dom.make(<form>
    <img alt="" class="who"/>
    <textarea name="update"/>
    <input type="submit" value="go"/>
</form>));

var whoImg = dom.find(form, "img.who"); 
var username = msjs.make(function(msj){
    var request = msjs.require("java.javax.servlet.ServletRequest");
    var name = request.getParameter("name");
    if (!name) msjs.context.redirect("/msjs/demo/login.msjs");
    dom.setText("Welcome, "+ name, header);
    whoImg.alt = name;
    return name;
});

document.addCss("img.who", {
    border : "solid 1px black",
    cssFloat  : "left",
    width : "50px",
    minHeight : "50px"
});

var submit = dom.handle ("onsubmit", form, function(){
    var r =  {
        name : whoImg.alt,
        update : form.update.value
    }
    form.reset();

    return r;
});
var statusArray = msjs.require("demo.statuslist");
var statusList = msjs.make(function(msj){
    if (msj.submit) statusArray.push(msj.submit);
    msjs.log(statusArray);
    return statusArray;
});
statusList.dirty = true;

statusList.push(submit, "submit");

var updates = document.body.appendChild(dom.make(<div class="updates"/>));
var renderer = msjs.make(function(msj){
    dom.removeChildren(updates);
    msjs.each(msj.statusList.reverse(), function(status){
        var entry = updates.appendChild(document.createElement("div"));
        entry.style.clear = "both";
        var img = entry.appendChild(document.createElement("img"));
        img.className = "who";
        img.alt = status.name;
        var text = entry.appendChild(document.createElement("div"));
        dom.setText(status.update, text);
    });
});
renderer.push(statusList, "statusList");

var otherGraphIds = msjs.require("demo.othergraphs");
var transponder = msjs.require("msjs.transponder");
transponder.push(statusList, "statusList");
transponder.getOtherGraphIds = function(){
    msjs.log(otherGraphIds);
    return otherGraphIds;
}
otherGraphIds.push(msjs.require("msjs.graph").id);
