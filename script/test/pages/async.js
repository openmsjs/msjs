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

var count = 0;
var button = msjs();
$("<div><button>Click me</button></div>").appendTo("body").click(function(){
    button(count++);
});

var clientProducer = msjs( function(){
    return "Client update " + button();
}).depends(button);

var serverProducer1 = msjs( function(){
    var self = this;
    this.async(function(){
        java.lang.Thread.sleep(200);
        self("update " + button());
    });
}).depends(button).setPack(false);

var serverProducer2 = msjs( function(){
    if (this._future) this._future.cancel(true);
    var self = this;
    this._future = this.async(function(){
        java.lang.Thread.sleep(200);
        self("Server " + serverProducer1());
    });
}).depends(serverProducer1).setPack(false);

var addEl = function(text){
    if (!text) return;
    $("<div/>").text(text).appendTo(result);
}
var view = msjs(function(){
    addEl(clientProducer.ifUpdated());
    addEl(serverProducer2,ifUpdated());
}).depends(clientProducer, serverProducer2);

var result = $("<div/>").appendTo("body");
