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

var dom = msjs.publish({}, "Client");

//dom is the interface to java-land, so these require statements
//are necessary to load the modules that Page uses
msjs.require("document");
msjs.require("jquery");
var graph = msjs.require("msjs.graph");

dom.make = function(xmlOrName){
    return document.createElement(xmlOrName);
};
dom.add = function(xmlOrName){
    return document.body.appendChild(dom.make(xmlOrName));
};
dom.packMe = true;

dom.find = function(refEl, selector){
    var parsedSelector = this._parseSelector(selector);
    //msjs.log(selector, parsedSelector);
    var self = this;
    return this.seek(function(el){
        var rulePos = 0;

        function tryMatch(matchEl){
            if (self._selectorPartApplies(matchEl, parsedSelector[rulePos])){
                rulePos++;
                return true;
            }

            return false;
        }

        function found(){ return parsedSelector.length <= rulePos };

        //end of selector must match this element, or bail
        if (!tryMatch(el)) return false;

        var p = el;
        while(!found() && p != refEl){
            p = p.parentNode;
            tryMatch(p);
        }
        return found();
    }, refEl);
}

dom.findMsj = function(refEl, msj){
    return this.seek(function(el){
        if (dom.getDomMsj(el) == msj) return true;
    }, refEl);
}

dom._selectorPartApplies = function(el, selectorPart){
    if (selectorPart.id){
        return el.id == selectorPart.id;
    }

    if (selectorPart.pseudo) return false;//no pseudo class support

    if (selectorPart.nodeName){
        if (el.nodeName != selectorPart.nodeName.toUpperCase()) return false;
    }

    if (selectorPart.attrs){
        for (var k in selectorPart.attrs){
            var attrVal = selectorPart.attrs[k];
            //null means attribute must be present
            if (attrVal == null && !el[k]) return false;
            else if (attrVal != null && el[k] != attrVal) return false;
        }
    }

    var splitClasses = el.className ? el.className.split(" ") : msjs.THE_EMPTY_LIST;
    for (var i=0; i< selectorPart.classNames.length; i++){
        var name = selectorPart.classNames[i];
        var foundIt = false;
        for (var j=0; !foundIt && j< splitClasses.length; j++){
            //msjs.log(name, splitClasses[j], splitClasses[j] == name);
            if (splitClasses[j] == name) foundIt = true;
        }

        if (!foundIt) return false;
    }

    return true;
}

dom.getCssId = function(el){
    this._ensureHasId(el);
    return "#" + el.id;
}


dom._attrMatcher = /\[.*?\]/g;
dom._parseSelector = function (selector){
    var parsedSelectors = [];

    var selectors = selector ? selector.split(" ") : msjs.THE_EMPTY_LIST;
    var self = this;
    return msjs.map(selectors, function(s){
        var selector = self.trim(s);
        var parsed = { };

        var matchedAttrs = self._attrMatcher.exec(selector);
        if (matchedAttrs){
            parsed.attrs = {};
            msjs.each(matchedAttrs, function(attr){
                var attr = self.trim(attr);
                var split = attr.substring(1, attr.length -1).split("=");
                parsed.attrs[self.trim(split[0])] = self.trim(split[1]) || null;
            });
        }

        selector = selector.replace(self._attrMatcher, "");

        var pseudoSplit = selector.split(":");
        if (pseudoSplit.length > 1){
            parsed.pseudo = pseudoSplit.slice(1);
        }

        var classSplit = pseudoSplit[0].split(".");
        if (classSplit[0]){
            //this is a nodeName; came before the dot
            if (classSplit[0].charAt(0) == "#"){
                //this is an id
                parsed.id = classSplit[0].substring(1);
            } else {
                parsed.nodeName = classSplit[0];
            }
        }

        if (classSplit.length > 1){
            parsed.classNames = classSplit.slice(1);
        } else{
            parsed.classNames = msjs.THE_EMPTY_LIST;
        }

        return parsed;
    });
}

dom._lTrim = new RegExp("^[\\s]+", "g");
dom._rTrim = new RegExp("[\\s]+$");
dom.trim = function(str){
    str =  str.replace(this._lTrim, "");
    return str.replace(this._rTrim, "");
}

dom.getText = function(el, dontAppendSpace){
    var text = "";
    var space = dontAppendSpace ? "" : " ";
    this.seek(function(el) {
        if (el.nodeName == "#text") text += el.nodeValue + space;
    }, el);
    
    return text && text.substring(0, text.length-1);
}

dom.setText = function(text, el){
    if (text == null) return;
    //special case
    if (el.childNodes.length){
        var child = el.childNodes[0];
        if (el.childNodes.length == 1 && child.nodeValue != null){
            child.nodeValue = text;
        } else {
            throw("Can't set text on complex element " + el);
        }
    } else {
        el.appendChild(document.createTextNode(text));
    }
}


dom.addClass = function(className, el){
    if (this.hasClass(className, el)) return false;
    if (el.className && el.className.length) {
        className = el.className + " " + className;
    }
    el.className = className;

    return true;
}

dom.getElementWithClass = function(className, el){
    var self = this;
    return this.seek(function(el){
        return self.hasClass(className, el);
    }, el);
}

dom.getAncestorWithClass = function(className, el) {
    while (el && !this.hasClass(className, el)) {
        el = el.parentNode;
    }
    return el;
};

dom.getInputByName = function(inputName, el){
    if (el == null) {
        if (arguments.length == 2) this._throwUndefinedElement("getInputByName");
        el = this.domElement;
    }
    var self = this;
    return this.seek(function(el){
        return el.nodeName == "INPUT" && el.name == inputName;
    }, el);
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

//TODO: Remove this
dom.createElement = function(name, attrs, text){
    var el = document.createElement(name);
    if (attrs){
        for (var k in attrs){
            if (k == "style") throw ("Can't set style in dom.createElement");
            el[k] = attrs[k];
        }
    }
    if (text != null) this.setText(text, el);
    return el;
}

dom.stopAction = function() {
    if (msjs.context.isIE) {
        window.document.execCommand('Stop');
    } else {
        window.stop();
    }
}

dom.cancelEvent = function(event){
    if (!event) return;
    event.cancelBubble = true;
    if (event.stopPropagation) event.stopPropagation();
    if (event.preventDefault) event.preventDefault();
    if (msjs.context.isIE) event.returnValue = false;
}

dom.getMousePositionFromEvent = function(e) {
    var event = e.domEvent;
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

dom.getTargetFromEvent = function(event){
    var target = event.target;
    if (!target) target = event["srcElement"]; // don't obfuscate srcElement
    return target;
}

dom.insertBefore = function(newEl, existing) {
    existing.parentNode.insertBefore(newEl, existing);
}

dom.insertAfter = function(newEl, existing) {
    existing.parentNode.insertBefore(newEl, existing.nextSibling);
}

dom.removeChildren = function(el) {
    while(el.childNodes.length){
        el.removeChild(el.childNodes[ el.childNodes.length - 1]);
    }
}

dom.removeChild = function(el){
    if (!el.parentNode) return null;
    return el.parentNode.removeChild(el);
}

/**
 Gets the pixel position of a DHTML element on the client
 and returns it in an object with the keys 'x', and 'y'
 @return Object Object in the form of {x : <n> : y <m>}
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

dom.getComputedValue = function(prop, el) {
    if (el == null) {
        if (arguments.length == 2) this._throwUndefinedElement("getComputedValue");
        el = this.domElement;
        if (el == null) this._throwUndefinedElement("getComputedValue");
    }
    if (window.getComputedStyle) { // Firefox, Safari
        return window.getComputedStyle(el, null).getPropertyValue(prop);
    } else if (el.currentStyle) { // IE
        return el.currentStyle[prop];
    } else {
        throw "couldn't get computed value";
    }
}

dom.removeClass = function(className, el){
    if (el == null) {
        if (arguments.length == 2) this._throwUndefinedElement("removeClass");
        el = this.domElement;
    }
    var found = false;
    if (el.className && el.className.indexOf(className) != -1) {
        var classNames = el.className.split(" ");
        for (var i=0; i < classNames.length; i++) {
            if (classNames[i] == className) {
                classNames.splice(i, 1);
                found = true;
                break;
            }
        }
        el.className = classNames.join(" ");
    }

    return found;
};

dom.hasClass = function(className, el){
    if (el == null) {
        if (arguments.length == 2) this._throwUndefinedElement("hasClass");
        el = this.domElement;
    }
    if (el.className && el.className.indexOf(className) != -1) {
        var classNames = el.className.split(" ");
        for (var i=0; i < classNames.length; i++) {
            if (classNames[i] == className) return true;
        }
    }
    return false;
};

dom.convertToElement = function(xhtml){
    var container = document.createElement("div");
    container.innerHTML = xhtml;
    return container.childNodes[0];
}

// str is a string that contains character entities
dom.htmlToText = function(str) {
    var container = document.createElement("div");
    container.innerHTML = str;
    return container.innerText || container.textContent;
}

dom.isChild = function(testEl, el){
    var p = testEl;
    while(p){
        if (p == el) return true;
        p = p.parentNode;
    }
    return false;
}

dom.listeners = {};

dom._clientDomIds = 0;
dom._ensureHasId = function(domElement){
    if (!domElement.id){
        domElement.id = "_msjs_cde-" + this._clientDomIds++;
    }
}

dom.parseListenerArguments = function(args){
    var eventName = args[0];
    var domElement = args[1];

    this._ensureHasId(domElement);
    return {
        eventName : eventName,
        domElement : domElement,
        selector :  args.length > 3 ? args[2] : null,
        callback : args[args.length-1],
        eventId : domElement.id  + ":" + eventName
    }
}

dom.addListener = function(){
    var args = this.parseListenerArguments(arguments);

    if (!this.listeners[args.eventId]){
        var callbacks = [];

        var self = this;
        var handler = function(domEvent){
            var event = getEvent(domEvent);

            for (var i=0; i<callbacks.length; i++){
                var selected = self._select(callbacks[i].s, event.target, args.domElement);
                if (!selected) continue;

                callbacks[i].f(event, selected);
                if (event.isCancelled) return;
            }
        }

        if (msjs.context.isIE){
            args.domElement.attachEvent(args.eventName, handler);
        } else {
            args.domElement.addEventListener(args.eventName.substring(2), handler, false);
        }

        this.listeners[args.eventId] = callbacks
    }

    this.listeners[args.eventId].push({s: this._parseSelector(args.selector), f: args.callback});
}

dom.removeListener = function(){
    var args = this.parseListenerArguments(arguments);

    var callbacks = this.listeners[args.eventId];

    for (var i=0; callbacks && i<callbacks.length; i++){
        if (callbacks[i].f == args.callback){
            callbacks.splice(i, 1);
            //TODO
            //if (!callbacks.length) unregister listener

            return;
        }
    }

    msjs.log("No listener found for", args);
}

var getEvent = function(domEvent){
    return {
        domEvent : domEvent,
        target : domEvent.target || domEvent["srcElement"], // don't obfuscate srcElement
        cancel : function(){
            domEvent.cancelBubble = true;
            if (domEvent.stopPropagation) domEvent.stopPropagation();
            if (domEvent.preventDefault) domEvent.preventDefault();
            if (msjs.context.isIE) domEvent.returnValue = false;

            this.isCancelled = true;
        },
        isCancelled : false
    }
}

dom._select = function(selector, target, listenerEl){
    if (!selector.length) return target;

    var pos =selector.length-1;
    var selected = null;
    var node = target;

    //walk down the selector list and up the parent chain
    //if the current selector part matches, advance the pointer
    //if we reach the end before we hit the listenerEl, the selector applies
    while(pos >= 0 && node){
        if (this._selectorPartApplies(node, selector[pos])){
            pos--;
            if (!selected) selected = node;
        }

        if (node == listenerEl) break;
        node = node.parentNode;
    }



    return pos < 0 ? selected : null;
}

dom.unpack = function(packInfo, packedClientPackages){
    msjs.setPackInfo(packInfo);
    //make sure each client package is unpacked
    msjs.each(packedClientPackages, function(packed){
        msjs.unpack(packed);
    });
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
    msjs.each(packInfo.listeners, function(listener){
        dom.addListener(
            listener.eventName,
            document.getElementById(listener.domId),
            listener.selector,
            msjs.unpack(listener.callback)
        );
    });

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
dom.pack = function(){

    var unpackF = function(){
        var dom = msjs.require('msjs.dom');
        dom.unpack.apply(dom, arguments);
    }

    var packedClientPackages = [];

    msjs.each(msjs.clientPackages, function(packageName){
        //make sure it's packed
        if (packageName == "msjs") return;
        var packed = msjs.pack(msjs.require(packageName));
        //graph must go first
        if (packageName == "msjs.graph") packedClientPackages.unshift(packed);
        else packedClientPackages.push(packed)
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
    var listeners = msjs.map(this._listeners, function(args){
        return {
            domId: args.domElement.id,
            eventName : args.eventName,
            selector :  args.selector,
            callback :  msjs.pack(args.callback)
        }
    });

    return {
        listeners: listeners,
        newListeners: document.getEventHandlers()
    }
}

dom.setDomMsj = function(msj, el){
    el.msj = msj;
}

dom._ensureHasId = function(domElement){
    //This is safe to call even if the domElement already has an id
    domElement.generateId();
}

dom.convertToElement = function(xhtml){
    return document.createElement(new XML(xhtml) );
}

dom._listeners = [];
dom.addListener = function(){
    var args = this.parseListenerArguments(arguments);
    this._listeners.push( args);
}

dom.removeListener = function(){
    var args = this.parseListenerArguments(arguments);
    for (var i=0; i<this._listeners.length; i++){
        var l = this._listeners[i];
        if (l.callback == args.callback && l.eventId == args.eventId){
            this._listeners.splice(i, 1);
            return true;
        }
    }

    return false;
}

dom.handle = function(){
    var newHandler = msjs.make();
    newHandler.packMe = true;

    var args = this.parseListenerArguments(arguments)
    newHandler._updateF = args.callback;

    dom.addListener(args.eventName, args.domElement, args.selector, 
        function(event, selected){
            var r = newHandler._updateF(event, selected);
            if (r !== void 0) newHandler.update(r);
        }
    );

    args = null;

    return newHandler;

};

dom._cssRules = [];
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
