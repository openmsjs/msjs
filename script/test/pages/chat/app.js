var form = $(<form>
    <label>Name: <input name="name"/></label>
    <textarea name="message" rows="3" cols="24"/>
    <input type="submit" value="send"/>
</form>).appendTo("body");

var submit = msjs();
form.submit(function(){
    submit({
        name : form[0].name.value,
        message : form[0].message.value
    });
});

form.find("input[name=name]").focus();


var list = msjs.require("test.pages.chat.list");
var initializer = msjs(function(){
    return list.get();
});

var updater = msjs(function(){
    var submission = submit();
    list.add(submission);
    return submission;
}).depends(submit);

var out =$(<div/>).addClass("messages").insertBefore(form);
var messageTemplate = $(<div><span class="name"/>: <span class="message"/></div>);

var renderer = msjs(function(){
    var items =  updater.ifUpdated() || initializer.ifUpdated();
    if (!items) return;
    msjs.each(items , function(item){
        var message = messageTemplate.clone().appendTo(out);
        message.find(".name").text(item.name);
        message.find(".message").text(item.message);
        message.hide().slideDown();
    });

    out.animate({scrollTop: 10000});
}).depends(initializer, updater);

msjs.require("test.pages.chat.broadcast").add(updater);

msjs.require('msjs.dom').addCss("form", {
    width : "290px",
    display: "block",
    border : "solid 1px #1C2F56",
    padding: "10px",
    backgroundColor: "#EEEEEE",
    marginTop : "8px"
}).addCss("body", {
    backgroundColor : "#C6D5F5"
}).addCss("div.messages", {
    width : "300px",
    overflowY : "scroll",
    overflowX : "hidden",
    height : "200px",
    backgroundColor : "white",
    padding : "5px",
    border : "solid 1px #1C2F56"
}).addCss("label", {
    marginBottom : "5px",
    display : "block"
}).addCss(".name", {
    fontWeight : "bold"
}).addCss("input[type=submit]", {
    marginLeft : "5px"
});
