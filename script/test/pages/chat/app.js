var form = $(<form>
    <label>Name: <input name="name"/></label>
    <br/>
    <textarea name="message" rows="3" cols="24"/>
    <input type="submit" value="go"/>
</form>).appendTo("body");

var submit = msjs(form, "submit", function(){
    return {
        name : form[0].name.value,
        message : form[0].message.value
    }
});

msjs.require("test.pages.chat.list");
var initializer = msjs(function(){
    return list.get();
});

var updater = msjs(function(){
    return list.add(submit());
}).depends(submit);

var out =$(<div/>).appendTo("body");

var renderer = msjs(function(){
    out.children().remove();
    var list = updater() || initializer();
    msjs.each(list , function(item){
        $("<div/>").text(item.name + ": " + item.message).appendTo(out);
    });
}).depends(initializer, updater);

msjs.require("test.pages.chat.broadcast").add(updater);
