var div = $(<div/>).appendTo("body");;
msjs(function(){
    //this must run inside update
    div.text("page location is " + location.href);
});

function parseCookies(cookies){
    var pairs = cookies.split(";");
    var out = {};
    msjs.each(pairs, function(pair){
        var splitPair = pair.split("=");
        out[ splitPair[0] ] = splitPair[1];
    });

    return out;
}

var serverCookies = msjs(function(){
    return parseCookies(document.cookie);
});
serverCookies.packMe = false;

var tbody = $(<table>
    <thead>
        <tr>
            <td>name</td>
            <td>value</td>
        </tr>
    </thead>
    <tbody/>
</table>).appendTo("body").find("tbody");

var showCookies = msjs(function(msj){
    tbody.children().remove();
    for (var k in msj){
        var cookies = msj[k];
        for (var key in cookies){
            var tr = $("<tr>").appendTo(tbody);
            $("<td>").appendTo(tr).text(key);
            $("<td>").appendTo(tr).text(cookies[key]);
        }

    }
});

showCookies.push(serverCookies, "server");
