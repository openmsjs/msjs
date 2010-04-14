var inputA = $(<input/>).appendTo("body");
var inputB = $(<input/>).appendTo("body");

var a = msjs();
var b = msjs();
inputA.keyup(function(){a.update(inputA.val())});
inputB.keyup(function(){b.update(inputB.val())});

var server = msjs(function(msj){
    return msj.a + " | " + msj.b;
});
server.packMe = false;
server.pull(server.depends(a), "a");
server.pull(server.depends(b), "b");

var out = $(<div/>).appendTo("body");
var renderer = msjs(function(msj){
    out.text(msj.server);
});
renderer.push(server, "server");
