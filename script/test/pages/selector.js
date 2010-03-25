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

var list = $(<div>
    <div>Adam</div>
    <div class="item">Bet<span>boooo</span>ty</div>
    <div class="item last">Charles</div>
    <button>go</button>
</div>).appendTo("body");

list.find("button").click(function() {
    msjs.log('button hit');
});

list.find("div span").click(function(event, selected) {
    msjs.log('span hit', event, selected);
    return false;
});

list.find("div item").click(function(event, selected) {
    msjs.log('item hit', selected);
});

list.find("div.item.last").click(function(event, selected) {
    msjs.log('last hit', selected);
});

$(document.body).click(function(event){
    msjs.log('body hit', event.target);
});

list.find(".item").mouseover(function(event, selected){
    msjs.log('over item', selected);
});

var dom = msjs.require("msjs.dom");
var el = list[0];
dom.addCss(el, {
    width : "200px",
    backgroundColor: "silver"
});

dom.addCss(el, " .item", {
    color : "red"
});

dom.addCss(el, " .item", "span", {
    color : "green"
});
