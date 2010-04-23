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

assert("Nodes that refer to singletons shouldn't be packed",
        referSingleton.determinePack() == false);

assert("Nodes that refer to functions that refer to unpackable objects shouldn't be packed", 
       referFunctionThatRefersUnpackable.determinePack() == false);

assert("Circular reference works", circular.determinePack() == true);
