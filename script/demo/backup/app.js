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

var welcome = document.createElement(<h1/>);
var form = document.createElement(<form>
    <img alt="" class="who"/>
    <textarea name="status"/>
    <input type="submit" value="go"/>
</form>);

var imgPicker = msjs.require("demo.imgpicker");

var dom = msjs.require("msjs.dom");
var statusImg = dom.find(form, "img.who");
var username = msjs.make(function(msj){
    var request = msjs.require("java.javax.servlet.ServletRequest");
    var name = request.getParameter("name");
    if (name){
        dom.setText("Welcome, " + name, welcome);
        statusImg.alt = name;
        return String(name);
    } else {
        msjs.context.redirect("/msjs/demo/login.msjs");
    }
});


dom.addCss("img.who", {
    cssFloat : "left",
    width : "50px",
    minHeight : "50px",
    border : "1px solid black",
    marginRight : "5px"
});

var submit = dom.handle("onsubmit", form, function(){
    var r =  {
        name : statusImg.alt,
        src : statusImg.src,
        status : form.status.value
    }
    
    form.reset();

    return r;
});

var statii = msjs.require("demo.statii");
var statusList = msjs.make(function(msj){
    if (msj.input) statii.push(msj.input);
    return statii;
});
statusList.push(submit, "input");

statusList.dirty = true;

var statusDiv = document.createElement(<div class="statii"/>);
var renderer = msjs.make(function(msj){
    dom.removeChildren(statusDiv);
    msjs.each(msj.statii.reverse(), function(status){
        var div = statusDiv.appendChild(document.createElement("div"));
        div.className = "status";
        var img = div.appendChild(document.createElement("img"));
        img.alt = status.name;
        img.src = status.src;
        img.className = "who";
        var text = div.appendChild(document.createElement("div"));
        dom.setText(status.status, text);
    });
});
renderer.push(statusList, "statii");

dom.addCss(statusDiv, "div.status", {
    clear : "both"
});

dom.addCss(imgPicker, {
    clear : "both",
    display : "none"
});

dom.addCss(dom.getCssId(imgPicker) + ".shown", {
    display : "block"
});

var open = dom.handle("onclick", statusImg, function(){
    dom.addClass("shown", imgPicker);
});

var choose = dom.handle("onclick", imgPicker, "img", function(event){
    dom.removeClass("shown", imgPicker);
    statusImg.src = event.target.src;
});

var transponder = msjs.require("msjs.transponder");
var connectedGraphs = msjs.require("demo.connectedgraphs");
transponder.getOtherGraphIds = function(){
    return connectedGraphs;
}
connectedGraphs.push(msjs.require("msjs.graph").id);
transponder.push(statusList, "status");
