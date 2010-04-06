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

/**
    The dom object loads the document, and jQuery, and exposes a method which coordinates
    the packing and unpacking of a Page. It also provides a few convenience methods.
    @namespace The script object that corresponds to the Java Page.
    @name msjs.dom
*/
var dom = msjs.publish({}, "Client");
dom.packMe = true;

//dom is the interface to java-land, so these require statements
//are necessary to load the modules that Page uses
msjs.require("document");

/**
    msjs relies on jQuery, with a few extensions, to provide its DOM scripting
    interface. One major difference between msjs jQuery and stock jQuery is
    that in msjs, everywhere stringified html is accepted, E4X XML is also
    accepted. E4X can be reliably used on the server, and it's neater and less
    error prone than xml strings.

    See jQuery documentation for API reference.
    Current version of jQuery is v1.4.2
    @namespace standard jQuery core APIs
    @name jquery
*/

//This is documented here because the current version of jsdoc takes an
//absurdly long time on the jquery.js file.
msjs.require("jquery");
var graph = msjs.require("msjs.graph");

/**
    Get a string that uniquely identifies the given dom element on the page that
    can be used directly in a CSS rule.
    @name getCssId
    @methodOf msjs.dom#
    @param {DOM element} el The element to generate the id for.
    @return {String} A string that can be used to locate the given DOM element in 
    a CSS rule.
*/
dom.getCssId = function(el){
    this._ensureHasId(el);
    return "#" + el.id;
}

/**
    Get the coordinate information of an event that includes mouse
    information, such as one representing a click or mouseover event. 
    @name getMousePositionFromEvent
    @methodOf msjs.dom#
    @param {DOM event} event The event for which to get the position information.
    @return {Dictionary} An object with a keys for layerX, layerY, clientX,
    clientY, screenX, screenY, pageX, and pageY
*/
dom.getMousePositionFromEvent = function(e) {       
    var event = e.domEvent || e;
    // http://www.quirksmode.org/dom/w3c_cssom.html#mousepos
    var pos = {
        clientX: event.clientX,
        clientY: event.clientY,
        screenX: event.screenX,
        screenY: event.screenY
    };
    if (msjs.context.isIE) {
        pos.pageX = pos.clientX + (document.documentElement.scrollLeft 
                                  ?document.documentElement.scrollLeft
                                  :document.body.scrollLeft);
        pos.pageY = pos.clientY + (document.documentElement.scrollTop
                                  ?document.documentElement.scrollTop
                                  :document.body.scrollTop);
        // http://www.exforsys.com/tutorials/javascript/javascript-event-object-properties-and-methods.html
        pos.layerX = event.offsetX;
        pos.layerY = event.offsetY;
    } else {
        pos.pageX = event.pageX;
        pos.pageY = event.pageY;

        // supported by safari and firefox; untested in other browsers 
        pos.layerX = event.layerX;
        pos.layerY = event.layerY;
    }
    return pos;
}

/**
    Returns the target of the event. Depending on the browser, this is either 
    event.target or event.srcElement.
    @name getTargetFromEvent
    @methodOf msjs.dom#
    @param {DOM event} event 
    @return {DOM element} The target of the event.
*/
dom.getTargetFromEvent = function(event){
    return event.target || event.srcElement;
}

/**
    Gets the pixel position of a DHTML element on the client
    and returns it in an object with the keys 'x', and 'y'.
    @name getElementPosition
    @methodOf msjs.dom#
    @param {DOM element} element The element for which to get the position .
    @return {Dictionary} And object containing x and y keys with numeric values
    for for the absolute pixel position of the given element.
 */
dom.getElementPosition = function(e) {
    if (e == null) {
        if (arguments.length == 1) this._throwUndefinedElement("getElementPosition");
        e = this.domElement;
    }

    var r = { x : 0, y : 0 };

    var original = e;
    //TODO: only walk up the parentNode tree once, keeping a pointer to the next
    //offsetParent
    do{
        r.x += e.offsetLeft;
        r.y += e.offsetTop;
        //Safari appears to get offsetTop wrong for fixed elements
        if (e.style.position == "fixed") break;
        e = e.offsetParent;
    }while(e);

    e = original;
    do{
        if (e.style.position == "fixed") break;
        r.x -= e.scrollLeft;
        r.y -= e.scrollTop;
        if (e.nodeName == "HTML") break;
        e = e.parentNode;
    }while(e); //not document.body for iframe case
    return r;
}

dom._clientDomIds = 0;
dom._ensureHasId = function(domElement){
    if (!domElement.id){
        domElement.id = "_msjs_cde-" + this._clientDomIds++;
    }
}

/**
    Internal API. Unpacks the the information gathered in {@link msjs.dom#pack}
    on the client.
    @name unpack
    @methodOf msjs.dom#
*/
dom.unpack = function(packInfo, packedClientPackages){
    msjs.setPackInfo(packInfo);

    function unpackPackage(packageName){
        var packInfo = packedClientPackages[packageName];
        packedClientPackages[packageName] = null;
        if (packInfo) msjs.require(packageName).setPackInfo(packInfo);
    }

    //some ordering dependencies
    msjs.map(["msjs", "msjs.graph", "jquery"], unpackPackage);

    //now do the rest
    for (var k in packedClientPackages){
        unpackPackage(k);
    }
    
    this._unattachElements();
    graph.start();
}

dom._unattachElements = function() {
    var el = document.getElementById("_msjs_unattached");
    if (!el) return;
    while (el.childNodes.length) {
        el.removeChild(el.childNodes[el.childNodes.length -1]);
    }
    document.body.removeChild(el);
}

dom.setPackInfo = function(packInfo){
    msjs.each(packInfo.newListeners, function(listener){
        var el = msjs.unpack(listener.element);
        var callback = msjs.unpack(listener.callback);

        if (msjs.context.isIE){
            el.attachEvent("on" + listener.type, callback);
        } else {
            el.addEventListener(listener.type, callback,
                                             listener.useCapture);
        }

    });
}



/*! msjs.server-only **/
/**
    Internal API. Perpares info for transport to the client. Called by the Java
    Page
    @name pack
    @methodOf msjs.dom#
*/
dom.pack = function(request){
    var queryString  = request.getQueryString() || "";
    if (queryString) queryString = "?" + queryString;
    location.href = request.getRequestURL() + queryString;

    var unpackF = function(){
        var dom = msjs.require('msjs.dom');
        dom.unpack.apply(dom, arguments);
    };

    var packedClientPackages = {};

    //start the graph before packing
    msjs.require("msjs.graph").refreshAll();

    msjs.each(msjs.clientPackages, function(packageName){
        //make sure it's packed
        if (packageName == "msjs") return;
        var published = msjs.require(packageName);
        var packInfo = published.getPackInfo ? published.getPackInfo() : null;
        packedClientPackages[packageName] = packInfo;
    });

    var script = "("+ unpackF.toString() +")("+ 
        msjs.getPackInfo() + "," +
        msjs.toJSONWithFunctions(packedClientPackages) + 
    ")";

    this._renderCssRules();

    return document.renderAsXHTML(script);

}

dom.acceptMsj = function(request){
    var inboundQueue = this._handleUpdateRequest(request);
    return msjs.require("msjs.graph").acceptMsjFromRemote(inboundQueue);
}

dom.prepareReconnect = function(request){
    var inboundQueue = this._handleUpdateRequest(request);
    return msjs.require("msjs.graph").prepareReconnect(inboundQueue);
}

dom._handleUpdateRequest = function(request){
    //returns the inbound queue
    var q = request.getParameter("q");
    if (q == null) throw "No request queue!";
    return msjs.require("java.org.msjs.service.JSONConverter").convertToJS(q);
}

dom.getPackInfo = function(){
    return {
        newListeners: document.getEventHandlers()
    };
}

dom._ensureHasId = function(domElement){
    //This is safe to call even if the domElement already has an id
    domElement.generateId();
}

dom._cssRules = [];

/**
    Adds a css rule to the document.  The last argument should be an object
    containing javascript CSS property names and values. The preceeding arguments, 
    of which there may be any number, are String CSS identifiers that will be
    joined into a rule separated by spaces. Beware of the difference in the two
    examples below:
    @example
    //Applies border to .foo's in div
    dom.addCss("div", ".foo", {border : "solid 1px"}); 
    //Applies border to div.foo's
    dom.addCss("div" + ".foo", {border : "solid 1px"}); 
    @name addCss
    @methodOf msjs.dom#
    @param Arguments This method takes variable arguments.
*/
dom.addCss = function(){
    var selector = "";

    for (var i=0; i<arguments.length-1; i++){
        if (selector) selector += " ";
        var arg = arguments[i];
        selector += typeof arg == "string" ? arg : this.getCssId(arg);
    }

    var rules = arguments[arguments.length-1];//last arg is always the rule
    var r = {
        selector : selector,
        rules : rules
    };
    this._cssRules.push(r);
    return r;
}

var styleConversion = msjs.require("msjs.styleconversion");
dom._renderCssRules = function(){
    if (!this._cssRules.length) return null;

    var block = document.head.appendChild(document.createElement( "style" ));
    block.type = "text/css";

    for (var i=0; i<this._cssRules.length; i++){
        var s = this._cssRules[i].selector + " {";
        var rules = this._cssRules[i].rules;
        for(var k in rules){
            var sK = styleConversion[k];
            if (sK == null) sK = k;
            s += sK + ":" + rules[k] + ";";
        }
        s += "}\n";

        block.appendChild( document.createTextNode(s) );
    }
}
