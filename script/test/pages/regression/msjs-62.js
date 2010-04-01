var list = msjs(function(){
    return ['a', 'b', 'c'];
});

var el = $(<div/>).appendTo("body");
var renderer = msjs(function(msj) { 
    $.each(msj.list, function(i, info) { 
        $("<p>" + info + "</p>").appendTo(el).data("info", info); 
    }); 
    el.find("p").click(handleClick); 
}); 
renderer.push(list, "list"); 

var picker = msjs();
var handleClick = function() { 
    var info = $(this).data("info");
    picker.update(info);
    msjs.log(info);
} 
