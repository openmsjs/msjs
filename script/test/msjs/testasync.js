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

var assert = msjs.require("msjs.assert");
var a = msjs.make();

var returnValue;
var starter;
var latch;

returnValue = [];
starter = new java.util.concurrent.CountDownLatch(1);
latch = new java.util.concurrent.CountDownLatch(2);
a.async(function(){
    starter.await();
    returnValue[0]= true;
    a.update(true);
    latch.countDown();
});
    
a.async(function(){
    starter.await();
    returnValue[1]= true;
    a.update(true);
    latch.countDown();
});

assert(a.getMsj() == null);
starter.countDown();
latch.await();
var graph = msjs.require("msjs.graph");

assert(returnValue[0] == true);
assert(returnValue[1] == true);
assert(returnValue.length == 2);


returnValue = [];
starter = new java.util.concurrent.CountDownLatch(1);
latch = new java.util.concurrent.CountDownLatch(1);
var b = msjs.make();
var future = b.async(function(){
    //block this thread on the latch; this task should be cancelled
    //before the latch opens (below)
    starter.await();
    //shouldn't get here
    returnValue[0]= true;
    b.update(true);
    latch.countDown();
});
    
future.cancel(true);

b.async(function(){
    starter.await();
    returnValue[1]= true;
    b.update(true);
    latch.countDown();
});

assert(b.getMsj() == null);
starter.countDown();
latch.await();

assert(returnValue[0] == null);
assert(returnValue[1] == true);
assert(returnValue.length == 2);
