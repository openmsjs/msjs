
$(<table><tbody id="tbodyId"/></table>).appendTo("body"); 

/*1*/ $(<tr><td>one</td></tr>).appendTo("#tbodyId"); 
/*2*/ $("#tbodyId").append($(<tr><td>two</td></tr>)); 
/*3*/ $(<tr><td>three</td></tr>).appendTo($("body").find("#tbodyId")); 

