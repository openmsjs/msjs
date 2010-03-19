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

var imgPicker = document.createElement(<div>
    <form>
        <input name="q"/>
        <input type="submit" value="go"/>
    </form>
    <div class="results"/>
</div>);

var dom = msjs.require("msjs.dom");
var submit = dom.handle("onsubmit", dom.find(imgPicker, "form"),function(){
    return dom.find(imgPicker, "input[name=q]").value;
});
var request = msjs.require("demo.request");
var searchUrl = msjs.require("demo.searchurl");
var search = msjs.make(function(msj){
    var response = request(searchUrl + escape(msj.q));
    msjs.log(response);
    return response.result.responseData.results;
});
search.push(submit, "q");

var resultsDiv = dom.find(imgPicker, "div.results");
var renderer = msjs.make(function(msj){
    dom.removeChildren(resultsDiv);
    msjs.each(msj.searchResults, function(result){
        var img = resultsDiv.appendChild(document.createElement("img"));
        img.src = result.tbUrl;
    });
});
renderer.push(search, "searchResults");
msjs.publish(imgPicker);
