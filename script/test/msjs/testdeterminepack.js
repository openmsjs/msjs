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


function getNode(messenger){
    return messenger.graph.getNode(messenger.getId());
}

var circular = getNode(msjs());
circular.ref = {circular : circular}

var assert = msjs.require("msjs.assert");
assert("Nodes that refer to singletons shouldn't be packed", 
        msjs.isPackable(getNode(referSingleton)) == false);

assert("Nodes that refer to functions that refer to unpackable objects shouldn't be packed", 
       msjs.isPackable(getNode(referFunctionThatRefersUnpackable)) == false);

assert("Circular reference works", msjs.isPackable(circular) == null);
