var inputA = $(<input/>).appendTo("body");
var inputB = $(<input/>).appendTo("body");

var a = msjs();
inputA.keyup(function(){a(inputA.val())});
var b = msjs();
inputB.keyup(function(){b(inputB.val())});

var server = msjs(function(){
    return a() + " | " + b();
}).depends(a, b).setPack(false);
server.packMe = false;

var out = $(<div/>).appendTo("body");
var renderer = msjs(function(){
    out.text(server());
}).depends(server);
