var div = $(<div/>).appendTo("body");;
msjs(function(){
    //this must run inside update
    div.text("page location is " + location.href);
});

function parseCookies(cookies){
    var pairs = cookies.split(";");

    return msjs.map(pairs, function(pair){
        return pair.split("=");
    });
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
        msjs.each(cookies, function(pair){
            var tr = $("<tr>").appendTo(tbody);
            $("<td>").appendTo(tr).text(pair[0]);
            $("<td>").appendTo(tr).text(pair[1] || "");
        });

    }
});

showCookies.push(serverCookies, "server");
