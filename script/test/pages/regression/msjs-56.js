var picker = msjs(); 
$.each(["ping", "pong"], function(i, pp) { 
    $(<div>{pp}</div>).appendTo("body").click(function() { 
        msjs.log('xx', picker); 
    }); 
}); 
