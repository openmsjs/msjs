/*
 * Copyright (c) 2010 Sharegrove Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

$(<h1>Welcome, please log in</h1>).appendTo("body");
var form = $(<form>
    <label>Username:
        <input name="username"/>
    </label>
    <label>Password:
        <input name="password" type="password"/>
    </label>
    <input type="submit" value="go"/>
</form>).appendTo("body");

var submit = msjs();
form.submit(function(){
    submit.update({
        name : $("input[name='username']").val(),
        pass : $("input[name='password']").val()
    });
});

var authenticate = msjs.require("demo.authenticate");
var login = msjs(function(msj){
    if (authenticate(msj.input.name, msj.input.pass)){
        msjs.log("good login", msj.input.name);
        msjs.context.redirect("/msjs/demo/app.msjs?name=" + msj.input.name);
    } else return false;
});
login.push(submit, "input");

var error = msjs(function(msj){
    if (!msj.login) form.className = "error";
});
error.push(login, "login");

var dom = msjs.require("msjs.dom");
dom.addCss(dom.getCssId(form[0]) + ".error", "input[name=password]",{
    backgroundColor : "red"
});
