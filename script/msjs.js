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

var msjs = {};
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
    isclient : true,
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

//global scope on the client is simple
var bindings = { global : this, msjs : msjs};

/**
    This is just syntatic sugar for {@link msjs.graph#make}
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
    if (this.context.isclient){
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
    if (!this.context.isclient){
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

msjs.makeClosures = function(scopeInfo){
    //unpack closures
    this._closureValues = scopeInfo.pop();

    this._closureFunctions = scopeInfo;
    this._closures = [];
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



/*! msjs.server-only **/
msjs.bindContext = function(context, global){
    // Server overrides context value
    this.context = context;
    global.msjs = this;
    bindings.global = global;
    return bindings;
}

msjs.clientPackages = ["msjs"];
msjs._clientPublished = new java.util.HashMap();
msjs._scopeList = [];
msjs._scopeFunctions = [];
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

msjs.pack = function(value){
    if (this._clientPublished.containsKey(value)) {
        return {
            unpackRef: function() {
                return msjs.require(this.packageName);
            },
            packageName: this._clientPublished.get(value)
        };
    } else if (typeof value == "function" ){
        //TODO: Canonicalize function references
        var scope = this.context.getScope(value);
        var scopeNum = this._scopeList.indexOf(scope);
        if (scopeNum == -1){
            this._scopeList.push(scope);
            scopeNum = this._scopeList.length-1;
            this._scopeFunctions[scopeNum] = [];
        }

        this._scopeFunctions[scopeNum].push(value);
        var index = this._scopeFunctions[scopeNum].length-1;
        //Create packRef
        return {
            unpackRef: function() {
                return msjs.getClosure(this.scopeNum, this.index);
            },
            scopeNum: scopeNum,
            index : index
        };
    }

    return (value && value.getPackRef) ? value.getPackRef() : value;
}

msjs.getPackInfo = function(){
    return this._getScopes();
}


//Only call inject if needed; otherwise you always need to invoke Guice
//in order to run msjs
msjs.getExecutor = function(){
    if (!this._executor){
        this._executor = this.require("java.java.util.concurrent.ExecutorService");
    }
    return this._executor;
}

msjs._getScopes=  function(){
    var scopes = [];
    var freeVariableValues = [];
    var allScopeFunctions = this._scopeFunctions;
    msjs.each(this._scopeList, function(scope, scopeNum){
        //function(x, y){ //free variables passed as params
        // return [
        //      function(a){...},
        //      function(a, b){...}
        // ];
        //}

        var scopeVariables = [];
        var values = [];
        var freeScopeFunctions = "";
        var scopeFunctions = allScopeFunctions[scopeNum];

        for (var k in scope){
            var val = scope[k];
            if (k == "document" || k == "msjs" || k == "arguments") continue;
            if (val instanceof java.lang.String) val = String(val);
            if (val instanceof java.lang.Object) continue;
            if (val && val.packMe == false) continue;
            if (val === void 0) continue;

            var jsonVal = null;

            if (typeof val == "function"  && msjs.context.getScope(val) == scope){
                //this is a function within this scope; it needs to be defined locally
                //rather than passed in
                freeScopeFunctions += "var " + k + "=" + msjs.toJSON(val) + ";\n";
            } else {
                val = msjs.pack(val);
                if (val && val.unpackRef){
                    //msjs object
                    jsonVal = "("+ msjs.toJSON(val)+ ").unpackRef()";
                } else {
                    jsonVal = msjs.toJSON(val);
                }
                //try json pack

                if (jsonVal){
                    scopeVariables.push(k);
                    values.push(jsonVal);
                }
            }
        }

        var makeClosures = "function(" + scopeVariables.join() + "){";
        makeClosures += freeScopeFunctions;
        makeClosures += "return " + msjs.toJSON(scopeFunctions) + "}";

        scopes[scopeNum] = makeClosures;
        freeVariableValues[scopeNum] = "[" + values.join() + "]";
    });

    //last item on scopes list is the function that gets the values
    //var getFreeVariableValues = "function(){ return [" + freeVariableValues.join() + "]}";
    var freeVariableFunctions = msjs.map(freeVariableValues, function(freeVars){
        return "function(){ return " + freeVars + ";}";
    });
    scopes.push("[" + freeVariableFunctions.join() + "]");
    return "[" + scopes.join() + "]";
}

