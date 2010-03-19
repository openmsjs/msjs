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

//server
var a = msjs.make( function(){
    this.async(function(){
        var x = 1;
        while(x<5){
            java.lang.Thread.currentThread().sleep(1000);
            a.update(x++);
        }
    });
    return 0;
});

//client
var dom = msjs.require("msjs.dom");
var display1 = dom.add(<div/>);

var b = msjs.make(function(msj){
    var r = msj.a +1;
    dom.setText(r, display1);
    return r;
});

b.push(a, "a");

//server
//make sure the dependency for the get below is not shared with
//somethink that pushes it
var num= msjs.make(function(msj){
    return msj.a+1;
});
num.push(a, "a");

var c= msjs.make(function(msj){
    if (msj.num %2 == 0) return true;
});
c.push(num, "num");


//client
var display2 = dom.add("div");
var d = msjs.make(function(msj){
    var line = document.createElement("div");
    display2.appendChild(line);
    dom.setText(msj.num + " is even", line);
    return true;
});
d.get(num, "num");
d.push(c, "c");

//server
var listener = msjs.make(function(msj){
    return msj.b;
});
listener.get(b, "b");
listener.push(d, "d");
listener.packMe = false;

var doneEl = dom.add("div");
var display3 = msjs.make(function(msj){
    dom.setText("Last even: " + msj.listener, doneEl);
});
display3.push(listener, "listener");
