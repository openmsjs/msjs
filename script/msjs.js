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
    An object that forms the root of the msjs API.
    @name msjs
    @class msjs exposes the require/publish system, as well some
    useful convenience methods.

*/
var msjs = {};
/**
    The context is the link between msjs and the environment in which
    it's running. In the web browser, the context is a simple javascript
    object. On the server, it's the instance of MsjsScriptContext that
    contains the running environment.
*/
msjs.context = {
    setLoadingPackage: function(packageName){
        this.loadingPackage = packageName;
    },
    redirect : function(url){
        location.href = url;
    },
    console : null,
    loadPackage : function(){},
    getFromSingletonScope : function(){},
    log : function(args){ 
        if (!this.console){
            //Firefox + Firebug
            if (typeof(loadFirebugConsole) == "function"){
                this.console = loadFirebugConsole();
            } else if (msjs.require("global").console){
                //safari
                var self = this;
                this.console = {
                    log : function(){
                        var arguments = msjs.map(arguments, function(o){
                            return self.getWriteArg(o, true);
                        });
                        console.log.apply(console, arguments);
                    }
                };
            } else if (this.isIE){
                var isDev = false;
                if (isDev) {
                    var div = document.createElement("div");
                    div.style.position = "absolute";
                    div.style.right = "0px";
                    div.style.bottom = "0px";
                    div.style.border = "solid 1px black";
                    div.style.height = "200px";
                    div.style.width = "100%";
                    div.style.overflow = "auto";
                    document.body.appendChild(div);
                    this.console = {
                        log : function(){
                            var p = document.createElement("p");
                            p.style.margin = "0px";
                            p.style.paddingLeft = "4px";
                            p.style.paddingRight = "4px";
                            p.style.paddingBottom = "2px";
                            p.style.borderBottom = "solid 1px gray";
                            p.innerText = msjs.context.writeArgs(arguments);
                            this.window.appendChild(p);
                        },
                        window : div
                    };
                } else {
                    this.console = {log: function() {}};
                }
            }
        }
        if (this.console) this.console.log.apply(this.console, args);
        //else, integrate a debugger
    },
    getWriteArg : function(o, ignoreEl) {
        if(o && o._getDebugName){
            return o._getDebugName();
        } else if(o instanceof Object){
            // Ignore element when logging in Safari
            if (o.nodeName && ignoreEl) {
                return o;
            } else {
                return msjs.toJSON(o);
            }
        }else{
            return o;
        }
    },
    writeArgs : function(args, ignoreEl){
        var self = this;
        var msg = "";
        msjs.map(args, function(o){
            if (msg.length) msg += " , ";
            msg += self.getWriteArg(o, ignoreEl);
        });
        return msg;
    },
    isIE : typeof(navigator) != "undefined" &&
           /msie/i.test(navigator.userAgent) && !/opera/i.test(navigator.userAgent)
};

/**
    Can be checked to determine if msjs is running in the browser or on the server.
    If true, msjs is running in the browser.
*/
msjs.isClient = true;

//global scope on the client is simple
var bindings = { global : this, msjs : msjs};

/**
    This is just syntatic sugar for {@link graph#make}
*/
msjs.make = function(produceMsj){
    return this.require("msjs.graph").make(produceMsj);
}

msjs._packageIsLoading = {};

msjs.require = function(packageName){
    return bindings[packageName];
}

msjs.publish = function(value, scope){
    bindings[this.context.loadingPackage] = value;
    return value;
};

msjs.mock = function(packageName, binding){
    bindings[packageName] = binding;
    return binding;
}

/**
    Recursively copies an object or array, or returns a primitive value.
    Doesn't handle objects with prototypes
    @param base The value to be copied
*/
msjs.copy = function( base ){
    if ( typeof base != "object" ) return base;
    if (base == null) return null;

    var r;
    if (msjs.isArray(base)) r = [];
    else r ={};

    if (base){
        for( var k in base ){
            if (!base.hasOwnProperty(k)) continue;
            r[k] = msjs.copy(base[k]);
        }
    }

    return r;
}


/**
    Apply a function to each element in the given array, and return the array
    consiting of the return values. The array is folded, so that nulls returned from
    the parameter function aren't included in the result array.
    @param {Array} arr The input array.
    @param {Function} f The function to call with each element of the array. This function is
    called with two parameters: the first is the nth element of the array. The second is "n"; 
    the offset in the original array.
    @return {Array} The resulting array of return values from the parameter function, with
    nulls removed.
*/
msjs.map = function(arr, f){
    if (!arr) return [];
    var l = arr.length;
    if ( l == null ) l = msjs.getLength(arr);
    if ( !l ) return [];
    var r = [];
    for(var i=0; i < l; i++){
        var result = f ? f(arr[i], i) : arr[i];
        if (result!=null) {
            r.push(result);
        }
    }
    return r;
}

msjs.each = function(obj, f){
    if (!isNaN(obj.length) && (typeof obj != "string")){
        for (var i=0; i<obj.length; i++){
            f(obj[i], i);
        }
    } else if (obj){
        f(obj, 0);
    }
}

msjs.last = function(arr){
    if (!arr) return null;
    if (!isNaN(arr.length) && (typeof arr != "string")){
        return arr[arr.length-1];
    } else {
        return arr;
    }
}

/**
    Returns the length of an array, or the 1+the highest numeric key in an Object that 
    may be masquerading as an array.
    @param {Object} The object for which to get the highest numeric key.
    @return {Number} The highest numeric key for the given parameter, or 0 if the parameter is not
    an object or has no numeric keys.
*/
msjs.getLength = function( obj ){
    if ( !(obj instanceof Object) ) return 0;
    var l=0;
    for(var k in obj) {
        var n = Number(k);
        if ( isNaN(n) ) continue;
        l = Math.max(l, n+1);
    }
    return l;
}

/**
    Determines whether the given parameter is an array.
    @param value The value to be tested for array-ness
    @return {boolean} True if the parameter is an array, otherwise false.
*/
msjs.isArray = function( value ){
    //first test is needed since typeof null is "object"
    return (value != null && value instanceof Array);
}


/**
    Write the given parameters to the local log, as the defined by the msjs
    context. This method is variadic.
*/
msjs.log = function(){
    if (this.isClient){
        this.context.log(arguments);
        return;
    }

    var msg = "";
    var self = this;
    this.map(arguments, function(o){
        var v;
        if(o && o._getDebugName){
            v = o._getDebugName();
        } else if(o instanceof java.lang.String){
            v = String(o);
        } else if(o instanceof Object){
            if (typeof o == "xml") {
                v = o.toXMLString();
            } else {
                v = self.toJSON(o);
            }
        }else{
            v = o;
        }

        if (msg.length) msg += " , ";
        msg += v;
    });
    this.context.log( msg );
}

//Adapted from http://www.JSON.org/json2.js
msjs._jsonEscapeable = /[-"\\\x00-\x1f\x7f-\x9f]/g;

// table of character substitutions
msjs._jsonMeta = {
        '\b': '\\b',
        '\t': '\\t',
        '\n': '\\n',
        '\f': '\\f',
        '\r': '\\r',
        '"' : '\\"',
        '\\': '\\\\'
}


msjs._jsonQuote= function (string) {
    // If the string contains no control characters, no quote characters, and
    // no backslash characters, then we can safely slap some quotes around it.
    // Otherwise we must also replace the offending characters with safe escape
    // sequences.
    return '"' + this._jsonEscape(string) + '"';
}

msjs._jsonEscape= function (string) {
    var self = this;
    return this._jsonEscapeable.test(string) ?
                string.replace(this._jsonEscapeable, function (a) {
                    var c = self._jsonMeta[a];
                    if (typeof c === 'string') {
                        return c;
                    }
                    c = a.charCodeAt();
                    return '\\u00' + Math.floor(c / 16).toString(16) +
                                               (c % 16).toString(16);
                }) :
                string;
}

/**
    Convert the given value to a string that represents the object in JSON format.
    Because it would be expensive to detect cycles during serialization, this method
    throws an exception if it reaches a depth of greater than 500 recursive calls, 
    under the assumption that the depth is likely due to a cycle.

    On the server, this method knows to treat Java strings as Strings, and throws an
    exception if handed any other java object.
    
    @param value The literal or object to convert to JSON
    @return {String} JSON for the given parameter.
*/
msjs.toJSON = function(value, depth, quoteFunctions) { 
    //depth param is undocumented; used internally
    //use this to detect if we're stuck in cycle
    if (isNaN(depth)) depth =0;

    //We just don't serialize object trees deeper than 500 levels
    if (depth > 500) throw( "Max depth reached in " + value + "." );
    //icky server-dependent stuff -- but make sure we're not sticking something
    //where it doesn't belong
    if (!this.isClient){
        if (value instanceof java.lang.String){
            value = String(value);
        } else if (value instanceof java.lang.Object){
            throw ("Can't serialize " + value);
        }
    }

    // What happens next depends on the value's type.
    switch (typeof value) {
        case 'string':
            return this._jsonQuote(value);

        case 'number':
            // JSON numbers must be finite. Encode non-finite numbers as null.
            return isFinite(value) ? String(value) : 'null';

        case 'function':
            var val = value.toString();
            if (quoteFunctions) {
                val = this._jsonQuote(val);
            } else {
                //compress
                //FIXME: This should be controlled by config
                if (false){
                    val = val.replace(this._multipleSpaces, " ");
                    val = val.replace(this._newlines, "");
                }
            }
            return val;
        
        case 'boolean':
        case 'null':

            // If the value is a boolean or null, convert it to a string. Note:
            // typeof null does not produce 'null'. The case is included here in
            // the remote chance that this gets fixed someday.

            return String(value);

    // If the type is 'object', we might be dealing with an object or an array or
    // null.

        case 'object':
            // Due to a specification blunder in ECMAScript, typeof null is 'object',
            // so watch out for that case.

            if (!value) {
                return 'null';
            }

            // Make an array to hold the partial results of stringifying this object value.

            var partial = [];

            // If the object has a dontEnum length property, we'll treat it as an array.
            if (typeof value.length === 'number' &&
                !(value.propertyIsEnumerable('length'))) {

                // The object is an array. Stringify every element. Use null as a placeholder
                // for non-JSON values.

                for (var i = 0; i < value.length; i++) {
                    partial[i] = this.toJSON(value[i], depth+1, quoteFunctions) || 'null';
                }

                // Join all of the elements together, separated with commas, and wrap them in
                // brackets.
                return partial.length === 0 ? '[]' : '[' + partial.join(',') + ']';
            }

            // Otherwise, iterate through all of the keys in the object.

            for (var k in value) {
                var v = this.toJSON(value[k], depth+1, quoteFunctions);
                if (v) {
                    partial.push('"' + this._jsonEscape(k) + '"' + ':' + v);
                }
            }

            // Join all of the member texts together, separated with commas,
            // and wrap them in braces.

            return partial.length === 0 ? '{}' : '{' + partial.join(',') + '}';
    }
}

msjs._multipleSpaces = / +/g;
msjs._newlines = /\n/g;

//caution, this is ready-only. don't ever modify it
msjs.THE_EMPTY_LIST = [];

msjs.setPackInfo = function(packInfo){
    this._packInfo = packInfo;
}

msjs.getClosure = function(scopeNum, index){
    if (!this._closures[scopeNum]){
        var closures = this._closureFunctions[scopeNum];
        var values = this._closureValues[scopeNum];
        this._closures[scopeNum] = closures.apply( msjs.require("global"), values() );
         
        this._closureValues[scopeNum] = null;
        this._closureFunctions[scopeNum] = null;
    }
    
    return this._closures[scopeNum][index];
}

msjs._unpacked = [];
msjs._isUnpacking = {};
msjs.unpack = function(value){
    if (value && value._msjs_packed != null){
        var n = value._msjs_packed;
        if (msjs._unpacked[n] == msjs._isUnpacking) {
            msjs.log("Circular packing reference",msjs._packInfo[n*2], msjs._packInfo[n*2+1]);
            throw "Circular unpacking reference";
        } if (msjs._unpacked[n] === void 0){
            msjs._unpacked[n] = msjs._isUnpacking;
            //Don't use "this" in here, so we can call this directly from msjs.map (below)
            var freeVariables = msjs.unpack(msjs._packInfo[n*2+1]);
            var unpackF = msjs._packInfo[n*2];
            var unpackedVal = unpackF.apply(msjs.require("global"), freeVariables);
            msjs._unpacked[n] = unpackedVal;
        }

        return msjs._unpacked[n];
    }

    if (value && value.unpackRef){
        return value.unpackRef();
    }

    if (msjs.isArray(value)){
        return msjs.map(value, msjs.unpack);
    }

    return value;
}



/*! msjs.server-only **/
msjs.isClient = false;
msjs.bindContext = function(context, global){
    // Server overrides context value
    this.context = context;
    global.msjs = this;
    bindings.global = global;
    return bindings;
}

msjs.clientPackages = ["msjs"];
msjs._clientPublished = new java.util.HashMap();
msjs.require = function(packageName){
    var isJava = packageName.indexOf("java.") == 0;

    if (!isJava && packageName.toLowerCase() != packageName){
        throw "msjs package names should be lower case: " + packageName;
    }

    if (bindings[packageName] == this._packageIsLoading) {
        throw "Publish/requires cycle on " + packageName;
    }

    try{
        if (bindings[packageName] === void 0){
            //This allows the user to mock a java object
            if (isJava){
                return this.context.inject(packageName.substring(5));
            }

            var value = this.context.getFromSingletonScope(packageName);
            if (value !== void 0){
                bindings[packageName] = value;
            } else {
                bindings[packageName] = this._packageIsLoading;

                try{
                    this.context.loadPackage( packageName );
                } catch ( e ){
                    var cause = e.javaException && e.javaException.getCause();
                    if ( cause instanceof java.io.FileNotFoundException) {
                        e = "Unable to find " + packageName;
                    } 
                    throw e.javaException || e;
                } finally {
                    if (bindings[packageName] == this._packageIsLoading){
                        //nothing was published
                        bindings[packageName] = null;
                    }
                }
            }
        }
    }finally{
        if (this._clientPublished.containsValue(packageName) &&
            this.clientPackages.indexOf(packageName) == -1 ){
            this.clientPackages.push(packageName);
        }
    }

    return bindings[packageName];
}

msjs.assignDebugNames = function(packageName, scope){
    for (var k in scope){
        var val = scope[k];
        if (val && val._setDebugInfo) val._setDebugInfo(k, packageName)
    }
}

msjs.publish = function(value, scope){
    var packageName = String(this.context.loadingPackage);

    var currentValue = bindings[packageName];
    if (currentValue != this._packageIsLoading && 
        currentValue !== void 0){
        throw "Value already published for " + packageName;
    }

    if (scope == null) scope = "Context";
    switch (scope){
        case "Client":
            this._clientPublished.put(value, packageName);
            break;
        case "Singleton":
            value = this.context.assignToSingletonScope(packageName, value);
            break;
        case "Context":
            break;
        default:
            throw "Unrecognized scope " + scope;
    }

    bindings[packageName] = value;

    return value;
}

msjs._packList = [];
msjs.pack = function(value){
    var putInPackList = value && (
            typeof value == "function" ||
            value._msjs_getUnpacker ||
            this._clientPublished.containsKey(value)
    );

    if (putInPackList){
        var index = this._packList.indexOf(value);
        if (index == -1 ) index = this._packList.push(value) - 1;
        return { _msjs_packed : index };
    }

    return value;
}

msjs.getPackInfo = function(){
    var pl = this._getPackList();
    return pl;
}

//Only call inject if needed; otherwise you always need to invoke Guice
//in order to run msjs
msjs.getExecutor = function(){
    if (!this._executor){
        this._executor = this.require("java.java.util.concurrent.ExecutorService");
    }
    return this._executor;
}

msjs._dontPackNames = {
    "document" : true, 
    "msjs" : true, 
    "arguments" : true,
    "Number" : true,
    "String" : true,

}
msjs._getPackList=  function(){
    var unpackPairs = [];
    var i =0;
    while(i < this._packList.length){
        var item = this._packList[i++];

        if ( this._clientPublished.containsKey(item)){
            var args = [this._clientPublished.get(item), 
                        item.getPackInfo ? item.getPackInfo() : null];
            unpackPairs.push(this._unpackClientPublished.toString(), msjs.toJSON(args));
        } else if (item._msjs_getUnpacker){
            msjs.each(item._msjs_getUnpacker(), function(unpackInfo){
                unpackPairs.push(msjs.toJSON(unpackInfo));
            });
        } else if (typeof item == "function"){
            var names = [];
            var values = [];
            var aliases = null;

            var scope = msjs.context.getScope(item);
            var freeVariables = msjs.context.getFreeVariables(item);
            for (var k in freeVariables){
                var val = scope[k];
                if (k in msjs._dontPackNames) continue;
                if (val instanceof java.lang.String) val = String(val);
                if (val instanceof java.lang.Object) continue;
                if (val && val.packMe == false) continue;
                if (val === void 0) continue;

                if (val == item){
                    //in-scope alias for item
                    if (!aliases) aliases = [];
                    aliases.push(k);
                } else {
                    names.push(k);
                    values.push(msjs.pack(scope[k]));
                }
            }

            var members = null;
            for (var k in item){
                if (item.hasOwnProperty(k)){
                    if (members == null) members = {};
                    if (item[k] == item) throw "Unhandled self reference";
                    members[k] = msjs.pack(item[k]);
                }
            }
            //last argument to closure unpacker is unnamed, and contains
            //members of function, if any
            values.push(members, aliases);

            var aliases = aliases ? aliases.join("=") : "$msjsNoAliases";

            var unpackF = this._unpackClosure.toString();
            unpackF = unpackF.replace("$_args_$", names.join());
            unpackF = unpackF.replace("$_function_$", item.toString());
            unpackF = unpackF.replace("$_aliases_$", aliases);
            unpackPairs.push( unpackF, msjs.toJSON(values) );
        }
    };

    return "[" + unpackPairs.join() + "]";
}

//This is the template for unpacking closures
//Local variables must have obscure names,
//so they don't hide free variables
msjs._unpackClosure = function( $_args_$ ){
    var $msjsFunction = ($_function_$);
    var $_aliases_$ = $msjsFunction;
    var $msjsMembers = arguments[arguments.length-1];
    if ($msjsMembers){
        for (var $msjsMemberName in $msjsMembers){
            $msjsFunction[$msjsMemberName] = msjs.unpack($msjsMembers[$msjsMemberName]);
        }
    }
    return $msjsFunction;
}

msjs._unpackClientPublished = function(packageName, packInfo){
    var published = msjs.require(packageName);
    if (packInfo) published.setPackInfo(packInfo);
    return published;
}
