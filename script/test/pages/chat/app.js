var form = $(<form>
    <label>Name: <input name="name"/></label>
    <br/>
    <textarea name="message"/>
    <input type="submit" value="go"/>
</form>).appendTo("body");

var submit = msjs.bind(form, "submit", function(){
    return {
        name : form[0].name.value,
        message : form[0].message.value
    }
});

var list = msjs.require("test.pages.chat.list");
var updater = msjs(submit, function(){
    list.push(submit());
    return list;
});

var out =$(<div/>).appendTo("body");
msjs(updater, function(){
    out.children().remove();
    msjs.each(updater(), function(item){
        $("<div/>").text(item.name + ": " + item.message).appendTo(out);
    });
});

var broadcast = msjs.require("test.pages.chat.broadcast")
broadcast.add(updater);
