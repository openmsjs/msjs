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
var button = msjs.make();
$("<div><button>Click me</button></div>").appendTo("body").click(function() {
    button.update(count++);
});

var clientProducer = msjs.make( function(msj){
    return "Client update " + msj.button;
});
clientProducer.set("button", button);

var serverProducer1 = msjs.make( function(msj){
    var self = this;
    this.async(function(){
        java.lang.Thread.sleep(200);
        self.update("update " + msj.button);
    });
    return this.NOT_UPDATED;

});
serverProducer1.packMe = false;
serverProducer1.set("button", button);

var serverProducer2 = msjs.make( function(msj){
    if (this._future) this._future.cancel(true);
    var self = this;
    this._future = this.async(function(){
        java.lang.Thread.sleep(200);
        self.update("Server " + msj.model);
    });
    return this.NOT_UPDATED;
});
serverProducer2.packMe = false;
serverProducer2.set("model", serverProducer1);
serverProducer2._future = null;

var view = msjs.make(function(msj){
    if (msj.clientModel) this._addEl(msj.clientModel);
    if (msj.serverModel) this._addEl(msj.serverModel);
});

view.set("clientModel", clientProducer, true);
view.set("serverModel", serverProducer2, true);

var result = $("<div/>").appendTo("body");
view._addEl = function(text){
    $("<div/>").text(text).appendTo(result);
}
