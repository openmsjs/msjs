var singleton = msjs.require("test.singleton");
var referSingleton = msjs(function(){
    return singleton;
});

var f = function(){
    return new java.lang.Object();
}
var referFunctionThatRefersUnpackable = msjs(function(){
    return f();
});


var circular = msjs();
circular.ref = {circular : circular}

var assert = msjs.require("msjs.assert");
referSingleton._msjs_isPackable();
assert("Nodes that refer to singletons shouldn't be packed", 
        msjs.isPackable(referSingleton) == false);

/*
assert("Nodes that refer to functions that refer to unpackable objects shouldn't be packed", 
       msjs.isPackable(referFunctionThatRefersUnpackable) == false);

assert("Circular reference works", msjs.isPackable(circular) == null);
*/
