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
var table = dom.add(<table><tbody><tr/></tbody></table>);

function addCol(el){
    var tr = table.getElementsByTagName("tr")[0];
    var td = document.createElement("td");
    td.style.verticalAlign = "top";
    td.style.paddingRight = "100px";
    td.appendChild(el);
    tr.appendChild(td);
    return el;
}

var sourcesEl = addCol(document.createElement(
    <div>
        Drag stuff from here :<br/>
        <div class="drag-me" style="width:50px;height:50px;background-color:yellow; margin-bottom:100px; border:solid black 1px">
            foo
        </div>
        <br/>
        <div class="drag-me" style="width:100px; height:100px; background-color:teal; margin-bottom:100px; border:solid black 1px;">
            <div style="width:50px; height:50px; background-color:green; border:solid 1px; margin:25px;">
            77.7
            </div>
        </div>
    </div>
));

/*
dom.addListener("onclick", sourcesEl, function(event){
    event.cancelEvent();
});
*/

var sources = dom.handle("onmousedown", sourcesEl, ".drag-me", function(event, el){
    event.cancel();
    var pos = dom.getElementPosition(el);
    var mouse = dom.getMousePositionFromEvent(event);
    var dx = mouse.pageX - pos.x;
    var dy = mouse.pageY - pos.y;

    var dragee = el.cloneNode(true);
    dragee.id = "";
    dragee.style.position = "absolute";

    //put it in the right place
    var moveHandler = function(event){
        var mouse = dom.getMousePositionFromEvent(event);
        dragee.style.left = (mouse.pageX - dx) + "px";
        dragee.style.top =  (mouse.pageY - dy) + "px";
        target.handleDragEvent("move", event, dragee);
    }

    var upHandler = function(event){
        dom.removeListener("onmousemove",document.body, moveHandler);
        dom.removeListener("onmouseup", document.body, upHandler);
        target.handleDragEvent("up", event, dragee);
    }

    document.body.appendChild(dragee);
    moveHandler(event);
    dom.addListener("onmousemove", document.body, moveHandler);
    dom.addListener("onmouseup", document.body, upHandler);
});


var targetEl = addCol(document.createElement(
    <div>
        Drop stuff here <br/>
        <div class="box" style="width:150px; height:300px; border: solid 1px; padding:10px">
        </div>
    </div>
));


var target = msjs.make();
var box = dom.find(targetEl, ".box");

target.droppedElement = null;
target.handleDragEvent = function(type, event, el){
    var mouse = dom.getMousePositionFromEvent(event);
    var x = mouse.pageX;
    var y = mouse.pageY;
    var isIn = this._isPointInside(x, y);
    box.style.borderColor = (isIn && type == "move")? "red" : "black";
    if (type == "up"){
        if (isIn){
            if (this.droppedElement){
                this.droppedElement.parentNode.removeChild(this.droppedElement);
            }
            el.style.position = "static";
            this.droppedElement = box.appendChild(el);
        } else {
            el.parentNode.removeChild(el);
        }
    }
}

target._isPointInside = function(x,y){
    var pos = dom.getElementPosition(box);
    var width  = 150+20, //don't forget about padding
        height = 300+20;

    return (pos.x < x && pos.y < y && x < (pos.x+width) && y < (pos.y + height));
}
