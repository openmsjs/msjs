var div = $(<div/>).appendTo("body");

var init = msjs(function(){
    //this must run inside update
    var loc = location.href;
    $("<div/>").text("page location is " + loc).appendTo(div);;
    var index = loc.indexOf("?");
    var qstring = index > 0 ? loc.substring(index) : "";

    var serverCookieName = "server.qstring";
    var oldQueryString = null;

    msjs.each(parseCookies(), function(cookie){
        if (cookie[0] == serverCookieName){
            oldQueryString = cookie[1];
            return false;
        }
    });

    $("<div/>").text("old query string was " + oldQueryString).appendTo(div);;

    //expires in 1 day
    var expires = new Date( new Date().getTime() + 24*60*60*1000 );
    document.cookie= serverCookieName + "=" + escape(qstring) + 
        "; expires=" + expires.toUTCString()+";";

    return qstring;
});

function trim(s){
	return s.replace(/^\s+|\s+$/g,"");
}
    
function parseCookies(){
    var pairs = document.cookie.split(";");

    return msjs.map(pairs, function(pair){
        var splits = pair.split("=");
        var key = splits.shift();
        var val = splits.join("=");
        return [trim(unescape(key)), trim(unescape(val))];
    }).sort(function(a,b){
        var pos= a[0] == b[0] ? 1 : 0;
        return a[pos] == b[pos] 
            ? 0 
            : (a[pos] < b[pos] ? -1 : 1);
    });
}


var tbody = $(<table cellspacing="0" style="border-collapse:collapse;">
    <col style="width:100px"/>
    <col/>
    <col/>
    <thead>
        <tr>
            <td>name</td>
            <td>value</td>
            <td>remove</td>
        </tr>
    </thead>
    <tbody/>
</table>).appendTo("body").find("tbody");

var retire = (new Date(0)).toUTCString();
var showCookies = msjs(function(msj){
    tbody.children().remove();
    var cookies = parseCookies();
    msjs.each(cookies, function(pair){
        var tr = $("<tr>").appendTo(tbody);
        $("<td>").appendTo(tr).text(pair[0]);
        $("<td>").appendTo(tr).text(pair[1] || "");
        var button = $("<td><button>X</button></td>").appendTo(tr).find("button");
        var key = escape(pair[0]);
        button.click(function(){
            document.cookie = key+"=; expires=" + retire + ";"; 
            showCookies.update();
        });
    });
});
showCookies.depends(init);

$(<button>Refresh cookies</button>).click(function(){
    showCookies.update();
}).appendTo("body");

var form = $(<form>
    <div>Add cookie:</div>
    <label>key:<input name="key"/></label>
    <label>value:<input name="val"/></label>
    <input type="submit" value="add cookie"/>
</form>).submit(function(){
    var domForm = form.get(0);
    document.cookie = escape(domForm.key.value)+"="+ escape(domForm.val.value) + ";"; 
    showCookies.update();
}).appendTo("body");

var dom = msjs.require("msjs.dom");

dom.addCss(tbody.parent(), {
    marginTop:"20px"
});

dom.addCss("thead", {
    backgroundColor: "#2222AA",
    color : "white"
});

dom.addCss("td", {
    border : "solid 1px gray",
    padding: "4px"
});

dom.addCss(form, {
    marginTop:"20px"

});
dom.addCss(form, "input",{
    marginRight: "10px"
});
