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

$(<h1>Simple chat</h1>).appendTo("body");

var form = $(<form>
    <label>Name:
        <input name="username"/>
    </label>
    <textarea name="message" style="display:block"/>
    <input type="submit" value="go"/>
</form>).appendTo("body");

var submit = msjs();
form.submit(function(){
    submit.update({
        username : $("input[name='username']").val(),
        message : $("textarea").val()
    });
});


var listener = msjs.require("chat.listener");
listener.push(submit, "submit");

var output = $(<div/>).appendTo("body");
var renderer = msjs(function(msj){
    output.empty();
    msjs.each(msj.list, function(item){
        $("<div/>").appendTo(output).text(item.username + ": " + item.message);
    });

});
renderer.push(listener, "list");

var transponder = msjs.require("msjs.transponder");
transponder.push(listener, "listener");
var otherGraphs = msjs.require("chat.othergraphs");

transponder.getOtherGraphIds = function(){
    return otherGraphs;
}

otherGraphs.push(msjs.require("msjs.graph").id);
