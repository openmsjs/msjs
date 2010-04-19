var form = $(<form>
    <label>Name: <input name="name"/></label>
    <br/>
    <textarea name="message"/>
    <input type="submit" value="go"/>
</form>).appendTo("body");

var submit = msjs(form, "submit", function(){
    return {
        name : form[0].name.value,
        message : form[0].message.value
    }
});

var list = msjs.require("test.pages.chat.list");
var initializer = msjs(function(){
    return list;
});

var updater = msjs(function(){
    list.push(submit());
    return list;
}).depends(submit);

var out =$(<div/>).appendTo("body");

var renderer = msjs(function(){
    out.children().remove();
    var list = updater() || initializer();
    msjs.each(list , function(item){
        $("<div/>").text(item.name + ": " + item.message).appendTo(out);
    });
}).depends(initializer, updater);

var broadcast = msjs.require("test.pages.chat.broadcast")
broadcast.add(updater);
