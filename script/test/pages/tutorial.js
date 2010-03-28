var form = $(<form>
    <label> String to encrypt:
        <input name="userString"/>
    </label>
    <input type="submit" value="Go"/>
</form>).appendTo("body");

var submit = msjs();
form.submit( function(event){
    submit.update( form.find("input").val() );
});


var MD5er = new Packages.org.msjs.service.MD5();
var encrypt = msjs(function(msj){
    return MD5er.encrypt(msj.submit);
});
encrypt.push(submit, "submit");

var output = $(<div><span>MD5 hash key is: </span><span/></div>).appendTo(document.body);
var renderer =  msjs(function(msj){
    output.find("span").last().text(msj.encrypted);

});
renderer.push(encrypt, "encrypted");
