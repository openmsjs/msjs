//Throws max depth exception without fix
var tt = $(<table id="db"> 
    <tbody/> 
</table>).appendTo("body"); 

msjs.log("***");
var tbody = $("#db tbody"); 
msjs.log(tbody, tbody[0]);
var node = msjs(function(msj) { 
    $("<tr><td>hello</td></tr>").appendTo("#db tbody"); 
}); 
