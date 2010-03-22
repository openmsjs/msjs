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
var list = dom.add(<div>
    <div>Adam</div>
    <div class="item">Bet<span>boooo</span>ty</div>
    <div class="item last">Charles</div>
    <button>go</button>
</div>);

dom.handle("onclick", list, "button", function(){
    msjs.log('button hit');
});

dom.handle("onclick", list, "div span", function(event, selected){
    event.cancel();
    msjs.log('span hit', selected);
});

dom.handle("onclick", list, "div.item", function(event, selected){
    msjs.log('item hit', selected);
});

dom.handle("onclick", list, "div.item.last", function(event, selected){
    msjs.log('last hit', selected);
});

dom.handle("onclick", document.body, function(event){
    msjs.log('body hit', event.target);
});

dom.handle("onmouseover", list, ".item", function(event, selected){
    msjs.log('over item', selected);
});

dom.addCss(list, {
    width : "200px",
    backgroundColor: "silver"
});

dom.addCss(list, " .item", {
    color : "red"
});

dom.addCss(list, " .item", "span", {
    color : "green"
});
