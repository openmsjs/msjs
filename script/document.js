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

/*! msjs.server-only **/
var domElementConstructor = function(){};
var domelement = domElementConstructor.prototype;
domelement._all = [];

domelement.parentNode = null;
domelement.packMe = true;

domelement.make = function(pDom){
    var d = new domElementConstructor();
    d._init(pDom);
    return d;
}

domelement._init = function(pDom){
    var all = domelement._all;
    this._elId = all.length;
    all[this._elId] = this;

    if (pDom == null) throw("missing dom information");

    //not XML coerced to string, or a text xml node
    if ( !(pDom instanceof XML) || pDom.name() == null){
        this.nodeValue = pDom.toString();
        this.nodeName = "#text";
    } else {
        //only element nodes get ids
        this.nodeName = pDom.name().localName.toUpperCase();

        //attributes
        var attributes = pDom.attributes();
        for (var i=0; i< attributes.length(); i++){
            var attrName  = attributes[i].name();
            var attrValue  = attributes[i].toString();
            if (attrName == "style"){
                attrValue = this.parseStyle(attrValue);
            } else if (attrName == "class"){
                attrName = "className";
            }

            this[attrName] = attrValue;
        }
        //every elementNode has a style
        if (!this.style) this.style = {};

        //children
        this.childNodes = [];
        var childNodes = pDom.children();
        for (var i=0; i< childNodes.length(); i++){
            var child = childNodes[i];
            //skip whitespace
            if (!child.name() && child.toXMLString().match(this._whitespaceMatcher)) continue;
            this.appendChild(child);
        }
    }
}

domelement._whitespaceMatcher = /^\s*$/g;
domelement._styleMatcher = /.*?:.*?;/g;
domelement._stylePropertyMatcher = /\s*(\S*)\s*:\s*(.*?)\s*;/;
//This is public so it can be used as a utility function (statically) elsewhere
domelement.parseStyle = function(styleString){
    var style = {};
    if (styleString.charAt(styleString.length-1) != ";"){
        styleString += ";";
    }
    var matches = styleString.match(this._styleMatcher);
    for (var i =0; matches && i<matches.length; i++){
        var parsed = matches[i].match(this._stylePropertyMatcher);
        var k = parsed[1];
        k = reverseStyleConversion[k] || k;
        style[k] = parsed[2];
    }
    return style;
}

domelement.appendChild = function(child){
    //jQuery does this with a comment node for testing
    if (child == null) return null;

    if (! (child instanceof domelement) ){
        child  = domelement.make(child);
    }
    this.childNodes.push(child);
    child.parentNode = this;
    return child;
}

domelement._removed = false;
domelement.removeChild = function(child){
    for (var i=0; i < this.childNodes.length; i++){
        if (this.childNodes[i] == child){
            this.childNodes.splice(i, 1);
            child.parentNode = null;
            return child;
        }
    }
    return null;
}

domelement.replaceChild = function(newChild, oldChild){
    if (oldChild.parentNode != this){
    }

    this.insertBefore(newChild, oldChild);
    var removed = this.removeChild(oldChild);
    if (!removed) {
        throw "Couldn't find child " + oldChild.generateId() + " in " + this.generateId();
    }
    return removed;
}


domelement.insertBefore = function(newChild, refChild){
    //although some browers allow this, IE doesn't, so this is an error
    if (refChild == null) throw "No node specified for insertBefore";

    for (var i=0; i < this.childNodes.length; i++){
        if (this.childNodes[i] == refChild){
            newChild.parentNode = this;
            this.childNodes.splice(i , 0, newChild);
            return newChild;
        }
    }

    throw("Couldn't find " + refChild + " in " + this);
}

domelement.getElementsByTagName = function(name){
    var all = this._all;
    var r = [];
    var uName = name.toUpperCase();
    for (var i=0; i<all.length; i++){
        var el = all[i];
        if (el.nodeName == "#text") continue;
        if (el.nodeName != uName) continue;

        var isChild = false;
        var p = el;
        while(p && !isChild){
            isChild = p.parentNode == this;
            p = p.parentNode;
        }

        if (isChild) r.push(el);
    }

    return r;
}

domelement.focus = function(){
    document._initialfocus = this.generateId();
}

domelement.generateId = function(){
    if (!this.id) this.id = "_msjs_de-" + this._elId;
    return this.id;
}

domelement._getDebugName = function(){
    var name = "domelement:"+this.nodeName;
    if (this.id) name += "#" + this.id;
    return name;
}

domelement.xhtmlNs = Packages.org.jdom.Namespace.getNamespace("http://www.w3.org/1999/xhtml");
domelement.innerHTML = null;
domelement.toJDOM = function(){
    if (this.nodeName == "#text") return new Packages.org.jdom.Text( this.nodeValue );

    var el = new Packages.org.jdom.Element(this.nodeName.toLowerCase(), this.xhtmlNs);
    
    for (var k in this){
        if (!this._isAttribute(k)) continue;

        var v = this[k];
        switch (k){
            case "_id":
                el.setAttribute("id", v);
                break;

            case "style":
                
                var style = this.assembleStyle(v);
                if (style == "") break;
                el.setAttribute("style", style);
                break;
                
            case "className":
                el.setAttribute("class", v);
                break;

            case "checked":
            case "readOnly":
            case "disabled":
                var xAttr = k.toLowerCase();
                if (v) el.setAttribute(xAttr, xAttr);
                break;

            default:
                if (v == null || v === "") continue;
                el.setAttribute(k, v);
                break;
        }
    }

    if (this.msj != null){
        var s = this.className || "";
        if (s) s += " ";
        s += this._getMsjClass(this.msj);
        el.setAttribute("class", s);
    }

    //now handle children
    var doChildren = true;
    if (this.nodeName == "SCRIPT"){
        el.setAttribute("type", "text/javascript"); //what else?
        if (this.childNodes && this.childNodes.length){
            el.addContent("//");
            var scriptString = "void 0;\n";
            msjs.each(this.childNodes, function(child){
                scriptString += child.nodeValue + "\n";
            });
            el.addContent( new Packages.org.jdom.CDATA( scriptString + "\n//") );
        }
        return el;
    }


    if (this.nodeName == "FORM"){
        el.setAttribute("method", "post");
        if (!this.action){
            el.setAttribute("action", "#form-" + this.id || "anon");
        }
        if (!this.onsubmit){
            el.setAttribute("onsubmit", "return false");
        }
    }

    msjs.each(this.childNodes, function(child){
        el.addContent(child.toJDOM());
    });

    return el;
}

domelement._getMsjClass = msjs.require("msjs.getmsjclass");

var styleConversion = msjs.require("msjs.styleconversion");
domelement.assembleStyle = function(styleObj){
    var style = "";
    for (var sK in styleObj){
        var sV= styleObj[sK];
        if (sV == null) continue;
        var sK = styleConversion[sK] || sK;
        style += sK + ":" + sV + ";";
    }

    return style;
}



var reverseStyleConversion = {};
for (var k in styleConversion){
    reverseStyleConversion[styleConversion[k]] = k;
}

domelement.getPackRef = function() {
    return {
        unpackRef: function() {
            return document.getElementById(this.id);
        },
        id: this.generateId()
    };
};

domelement.cloneNode = function(deep) {
    if (this.nodeName == "#text"){
        return document.createTextNode(this.nodeValue);
    }

    var clone = document.createElement(this.nodeName);

    for (var k in this){
        if (this._isAttribute(k)) {
            clone[k] = msjs.copy(this[k]);
        }
    }

    if (deep) {
        msjs.map(this.childNodes, function(el){
            clone.appendChild(el.cloneNode(deep));
        });
    }
    return clone;
};

domelement._isAttribute = function(attr) {
    if (!this.hasOwnProperty(attr)) return false;
    if (this[attr] instanceof Function) return false;

    switch (attr){
        //not attributes
        case "parentNode":
        case "childNodes":
        case "_elId":
        case "cssRules":
        case "nodeName":
        case "head":
        case "body":
        case "msj":
        case "_focusable":
        case "_debugRef":
        case "_packageName":
        case "$packageName":
        case "_idcache":
        case "_removed":
        case "packMe":
        case "_debugRef":
            return false;
    }

    return true;
};

var onload = "(" + function(){msjs.require('msjs.graph').bodyOnLoad()} +")()";
var document = {};

document.createTextNode = function(text){
    return domelement.make(text);
}

document.createElement = function(xmlOrName){
    var xml = xmlOrName;
    if (typeof xmlOrName == "string") xml = <{xmlOrName}/>;;
    return domelement.make(xml);
}

/* jquery compatibility */
document.createComment = function(){};

var documentFragment = function(){
    this.childNodes = [];
}

document.createDocumentFragment = function(){
    var frag = new documentFragment();
    return frag;
}

documentFragment.prototype = new domElementConstructor();
documentFragment.prototype.cloneNode = function(){
    var frag = new documentFragment();

    msjs.each(this.childNodes, function(el){
        frag.childNodes.push(el.cloneNode(true));
    });

    return frag;
}

documentFragment.prototype.toJDOM = function(){
    return new Packages.org.jdom.Text( "fraggit" );
}

domelement.createDocumentFragment = document.createDocumentFragment;


/*end jquery stuff */

document.documentElement = domelement.make(
    <html lang="en">
        <head>
            <meta content="text/html;charset=utf-8" http-equiv="Content-Type" />
        </head>
        <body onload={onload}/>
    </html>
);
document.title = "Msjs Page";

document.head = document.documentElement.childNodes[0];
document.body = document.documentElement.childNodes[1];

document._initialfocus = null;

document._focusable = {
    INPUT  : true,
    BUTTON : true,
    SELECT : true,
    A      : true,
    TEXTAREA : true 
}

document._getScriptResources= msjs.require("msjs.getscriptresources");
document.renderAsXHTML = function(script){
    var head = this.head;
    var title = this.title;
    delete this.title;
    head.appendChild(<title>{title}</title>);
    msjs.each(this._getScriptResources(msjs.clientPackages), function(node){
        head.appendChild(node);
    });

    // place all unattached nodes in hidden div
    var unattachedEl = null;
    var all = domelement._all;
    for (var i=0; i < all.length; i++){
        var el = all[i];
        if (el.parentNode == null && el != this.documentElement && !el._removed){
            if (!unattachedEl) {
                unattachedEl = this.body.appendChild(<div id="_msjs_unattached" style="display: none"/>);
            }
            unattachedEl.appendChild(el);
        }
    }

    var config = msjs.require("java.org.msjs.config.MsjsConfiguration");
    var webappPath = config.getString("webappPath");

    //append callback iframe
    this.body.appendChild(
            <iframe name="_msjs_request" id="_msjs_request" frameborder="0" width="0" height="0"
                style="display: none" src={webappPath + "/file/request.html"} />
    );

    if (script){
        this.body.appendChild( <script>{script}</script>);
    }

    if (this._initialfocus){
        this.body.appendChild(
            <script>"document.getElementById('" + this._initialfocus + "').focus()"</script>);
        this._initialfocus = null;
    }


    return this.documentElement.toJDOM();
}




document.isElement = function(value){
    return value && value instanceof domelement;
}

document._idcache = {};
document.getElementById = function(id){
    return this._idcache[id];
}

domelement.__defineSetter__("id", function(id){
    if (this._id){
        document._idcache[this._id] = null;
    }
    document._idcache[id] = this;
    this._id = id;
});

domelement.__defineSetter__("innerHTML", function(html){
    var name = this.nodeName.toLowerCase(); 
    var xml = "<" + name + ">" + html + "</" + name + ">";
    var made = document.createElement(new XML(xml));
    while (this.childNodes.length){
        this.removeChild(this.childNodes[0]);
    }
    while (made.childNodes.length){
        this.appendChild(
            made.removeChild(made.childNodes[0])
        );
    }
    //make sure this node doesn't get sent to client
    made._removed = true;
});

domelement.__defineGetter__("id", function(){
    return this._id;
});

domelement.__defineGetter__("nextSibling", function(){
    return this._findSibling(1);
});

domelement.__defineGetter__("firstChild", function(){
    return this.childNodes[0];
});

domelement.__defineGetter__("lastChild", function(){
    return this.childNodes[this.childNodes.length - 1];
});

domelement.__defineGetter__("previousSibling", function(){
    return this._findSibling(-1);
});

domelement._findSibling = function(direction){
    if (!this.parentNode) return null;
    var children = this.parentNode.childNodes;

    for (var i=0; i<children.length; i++){
        if (this == children[i]){
            return children[i+direction];
        }
    }

    return null;
}


//document puts itself in the global scope, just like document on the client
var global =msjs.require("global"); 
global.document = document;
global.location = {}; //TODO: href
global.window = global;

msjs.require("global").navigator = {
    cookieEnabled : true,
    mimeTypes : [],
    plugins : [],
    userAgent : "msjs fake window", 
    javaEnabled : false //ironic, no?
}
msjs.publish(document);
domelement.__defineGetter__("nodeType", function(){
    return nameToType[this.nodeName] || 1;
});

var nameToType = {
    "#text" : 3,
    "html" : 9,
    "#document-fragment" : 11
}
/*
1	ELEMENT_NODE
2	ATTRIBUTE_NODE
3	TEXT_NODE
4	CDATA_SECTION_NODE
5	ENTITY_REFERENCE_NODE
6	ENTITY_NODE
7	PROCESSING_INSTRUCTION_NODE
8	COMMENT_NODE
9	DOCUMENT_NODE
10	DOCUMENT_TYPE_NODE
11	DOCUMENT_FRAGMENT_NODE
12	NOTATION_NODE
*/
