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

var listEl =  $(<div/>).appendTo(document.body);

var form = $(
    <form><div>
        <input type="text" name="first"/>
        <input type="text" name="last"/>
        <input type="submit" value="go"/>
    </div></form>
).appendTo(document.body);

var submit = msjs(form, "submit",  function(event){
    var r = {
        first : form.get(0).first.value,
        last : form.get(0).last.value
    };

    form.get(0).reset();
    form.find("input").first().focus(); //:)

    return r;
});

var data = [
    {first : "abbie", last : "guggenheim"},
    {first : "bobby", last : "hiliard"},
    {first : "charlie", last : "ilkilkicker"}
];

var initial = msjs(function(){
    return data;
});

var updated = msjs(function(){
    data.push(submit());
    return data;
}).depends(submit).setPack(false);


var list = msjs( function(){
    listEl.children().remove();
    $.each(updated() || initial(), function(n, model){
        $("<div/>").text(model.first + " " + model.last).appendTo(listEl)
        .css({
            border : "solid 1px black",
            padding : "5px",
            width : "125px"
        });
    });
}).depends(initial, updated);
