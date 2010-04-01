//Throws max depth exception without fix
var tt = $(<table id="db"> 
    <tbody/> 
</table>).appendTo("body"); 

var tbody = $("#db tbody"); 
var node = msjs(function(msj) { 
    $("<tr><td>hello</td></tr>").appendTo("#db tbody"); 
}); 
