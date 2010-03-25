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

var header = $(<h1/>).appendTo("body");
var form = $(<form>
    <img alt="" class="who"/>
    <textarea name="update"/>
    <input type="submit" value="go"/>
</form>).appendTo("body");

var whoImg = form.find("img.who")[0]; 
var username = msjs.make(function(msj){
    var request = msjs.require("java.javax.servlet.ServletRequest");
    var name = request.getParameter("name");
    if (!name) msjs.context.redirect("/msjs/demo/login.msjs");
    header.text("Welcome, "+ name);
    whoImg.alt = name;
    return name;
});

var dom = msjs.require("msjs.dom");
dom.addCss("img.who", {
    border : "solid 1px black",
    cssFloat  : "left",
    width : "50px",
    minHeight : "50px"
});

var submit = msjs.make();
form.submit(function(){
    var r =  {
        name : whoImg.alt,
        update : this.update.value
    };
    this.reset();
    submit.update(r);
});
var statusArray = msjs.require("demo.statuslist");
var statusList = msjs.make(function(msj){
    if (msj.submit) statusArray.push(msj.submit);
    msjs.log(statusArray);
    return statusArray;
});
statusList.dirty = true;

statusList.push(submit, "submit");

var updates = $(<div class="updates"/>).appendTo("body");
var template = $(<div>
    <img class="who"/>
    <div/>
</div>.toXMLString()).css("clear", "both");
var renderer = msjs.make(function(msj){
    updates.empty();
    msjs.each(msj.statusList.reverse(), function(status){
        var entry = template.clone().appendTo(updates);
        entry.find("img").attr("alt", status.name);
        entry.find("div").text(status.update);;
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
