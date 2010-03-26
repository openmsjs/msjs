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

var table = $(<table><tbody><tr>
    <td><div>
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
    </div></td>
    <td><div>
        Drop stuff here <br/>
        <div class="box" style="width:150px; height:300px; border: solid 1px; padding:10px">
        </div>
    </div></td>
</tr></tbody></table>).appendTo(document.body);
table.find("td").css({ verticalAlign : "top", paddingRight : "100px"});

var dom = msjs.require("msjs.dom");
var sources = msjs.make();
table.find(".drag-me").mousedown(function(event){
    var pos = dom.getElementPosition(event.target);
    var mouse = dom.getMousePositionFromEvent(event);
    var dx = mouse.pageX - pos.x;
    var dy = mouse.pageY - pos.y;

    var dragee = $(this).clone(false);
    dragee.css({position : "absolute"});

    //put it in the right place
    var style = {};
    var moveHandler = function(event){
        var mouse = dom.getMousePositionFromEvent(event);
        style.left = (mouse.pageX - dx) + "px";
        style.top =  (mouse.pageY - dy) + "px";
        dragee.css(style);
        target.handleDragEvent("move", event, dragee[0]);
    };

    var upHandler = function(event){
        $("body").unbind("mousemove").unbind("mouseup");
        target.handleDragEvent("up", event, dragee[0]);
    };

    moveHandler(event);

    $("body").append(dragee).mousemove(moveHandler).mouseup(upHandler);

    return false;
});


var box = table.find(".box");
var target = msjs.make();
target.droppedElement = null;
target.handleDragEvent = function(type, event, el){
    var mouse = dom.getMousePositionFromEvent(event);
    var x = mouse.pageX;
    var y = mouse.pageY;
    var isIn = this._isPointInside(x, y);
    box.css("borderColor", (isIn && type == "move")? "red" : "black");
    if (type == "up"){
        if (isIn){
            if (this.droppedElement){
                this.droppedElement.parentNode.removeChild(this.droppedElement);
            }
            el.style.position = "static";
            this.droppedElement = el;
            box.append(el);
        } else {
            el.parentNode.removeChild(el);
        }
    }
}

target._isPointInside = function(x,y){
    var pos = dom.getElementPosition(box[0]);
    var width  = 150+20, //don't forget about padding
        height = 300+20;

    return (pos.x < x && pos.y < y && x < (pos.x+width) && y < (pos.y + height));
}
