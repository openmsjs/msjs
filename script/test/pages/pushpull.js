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
var display1 = $(<div/>).appendTo("body");

var b = msjs.make(function(msj){
    var r = msj.a +1;
    $(display1).text(r);
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
var display2 = $(<div/>).appendTo("body");
var d = msjs.make(function(msj){
    var line = $("<div/>").text(msj.num + " is even");
    display2.append(line);
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

var doneEl = $(<div/>).appendTo("body");
var display3 = msjs.make(function(msj){
    doneEl.text("Last even: " + msj.listener);
});
display3.push(listener, "listener");
