var list = msjs(function(){
    return ['a', 'b', 'c'];
});

var el = $(<div/>).appendTo("body");
var renderer = msjs(function() { 
    $.each(list(), function(i, info) { 
        $("<p>" + info + "</p>").appendTo(el).data("info", info); 
    }); 
    el.find("p").click(handleClick); 
}).depends(list); 

var picker = msjs();
var handleClick = function() { 
    var info = $(this).data("info");
    picker(info);
} 
