var dom = msjs.require("msjs.dom");
dom.add(<h1>Try it</h1>);
var jq = msjs.require("jquery");
var foo = dom.make(<h2>fooooo</h2>);

$("<h2>hi pablo</h2>").appendTo(document.body);
$(<h2>what happens</h2>).appendTo(document.body);
$(foo).appendTo(document.body);

jQuery(<h4>works</h4>).appendTo(document.body);
jq(<h4>doesn'tworks</h4>).appendTo(document.body);
