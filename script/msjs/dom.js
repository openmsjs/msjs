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
    @namespace The interface between the Java Page and the msjs graph and associated
    document.
    @name msjs.dom
*/
var dom = msjs.publish({}, "Client");
dom.packMe = true;

//dom is the interface to java-land, so these require statements
//are necessary to load the modules that Page uses
msjs.require("document");
msjs.require("jquery");
var graph = msjs.require("msjs.graph");

dom.findMsj = function(refEl, msj){
    return this.seek(function(el){
        if (dom.getDomMsj(el) == msj) return true;
    }, refEl);
}

dom.getCssId = function(el){
    this._ensureHasId(el);
    return "#" + el.id;
}

dom.seek = function(f, el){
    if (el == null) {
        if (arguments.length == 2) this._throwUndefinedElement("seek");
        el = this.domElement;
    }

    if (f(el)) return el;
    var q = [el.childNodes];
    var m=0;
    var n=0;
    while(q.length > m){
        var curr = q[m++];
        n = 0;
        while(curr.length > n){
            var e = curr[n++];
            if (f(e)) return e;
            
            if (e.childNodes && e.childNodes.length) q.push(e.childNodes);
        }
    }
    return null;
}

/**
    Returns the "msj" data for a msjs XHTML element. On the server, the
    parameter is expected to view-style dom node, with a msj
    attribute. On the client, the parameter is expected to be a DOM element.
    @name getDomMsj
    @methodOf msjs.dom#
    @param el The object for which to obtain the msj data.
    @return The msj data for the given element.
*/
dom.getDomMsj = function(el){
    if (el == null) {
        if (arguments.length == 1) this._throwUndefinedElement("getDomMsj");
        el = this.domElement;
    }
    if (el.className == null) return null;
    if (el.className.indexOf("_msjs_") > -1) {
        var msjMatch = el.className.match(this._msjMatcher);
        var unescaped = msjMatch[1];
        return decodeURIComponent(unescaped);
    }else if (el.value != null){
        return el.value;
    }
    return null;
}
dom._msjMatcher = /\b_msjs_(\S*)/;

dom.setDomMsj = function(msj, el){
    if (el == null) {
        if (arguments.length == 2) this._throwUndefinedElement("setDomMsj");
        el = this.domElement;
    }

    //remove old dom msj, if there is one
    if (el.className && el.className.indexOf("_msjs_") != -1) {
        var classNames = el.className.split(" ");
        for (var i=0; i < classNames.length; i++) {
            if (classNames[i].indexOf("_msjs_") == 0) {
                classNames.splice(i, 1);
                break;
            }
        }

        el.className = classNames.join(" ");

    }
    var msjClassName = this._getMsjClass(msj);
    if (!msjClassName) return;
    this.addClass(msjClassName, el);
}

dom._getMsjClass = msjs.require("msjs.getmsjclass");

/**
    @name getMousePositionFromEvent
    @methodOf msjs.dom#
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
    Returns event.target || event.srcElement.
    @name getTargetFromEvent
    @methodOf msjs.dom#
*/
dom.getTargetFromEvent = function(event){
    return event.target || event.srcElement;
}

/**
    Gets the pixel position of a DHTML element on the client
    and returns it in an object with the keys 'x', and 'y'.
    @return Object Object in the form of {x : <n> : y <m>}
    @name getElementPosition
    @methodOf msjs.dom#
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
    Unpacks the the information gathered in @link{msjs.dom#pack} on the
    client.
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
    Perpares info for transport to the client. Called by the Java Page
    @name pack
    @methodOf msjs.dom#
*/
dom.pack = function(){

    var unpackF = function(){
        var dom = msjs.require('msjs.dom');
        dom.unpack.apply(dom, arguments);
    };

    var packedClientPackages = {};

    msjs.each(msjs.clientPackages, function(packageName){
        //make sure it's packed
        if (packageName == "msjs") return;
        var published = msjs.require(packageName);
        var packInfo = published.getPackInfo ? published.getPackInfo() : null;
        packedClientPackages[packageName] = packInfo;
    });

    var script = "("+ unpackF.toString() +")("+ 
        msjs.getPackInfo() + "," +
        msjs.toJSON(packedClientPackages) + 
    ")";

    this._renderCssRules();

    return document.renderAsXHTML(script);

}

dom.getDomMsj = function(el){
    return el.msj;
}

dom.getPackInfo = function(){
    return {
        newListeners: document.getEventHandlers()
    };
}

dom.setDomMsj = function(msj, el){
    el.msj = msj;
}

dom._ensureHasId = function(domElement){
    //This is safe to call even if the domElement already has an id
    domElement.generateId();
}

dom._cssRules = [];

/**
    Adds a css rule to the document
    var args
    @name addCss
    @methodOf msjs.dom#
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
