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

document.createElement(<h1>Welcome! Please log in.</h1>);
var form = document.createElement(<form>
    <label for="username">Username:
        <input name="username"/>
    </label>
    <label for="pass">Password:
        <input name="pass" type="password"/>
    </label>

    <input type="submit" value="Go"/>
</form>);

var submit = dom.handle("onsubmit", form, function(){
    msjs.log(form);
    return {
        name : form.username.value,
        pass : form.pass.value
    };
});

var authenticate = msjs.require("demo.authenticate");
var login = msjs.make(function(msj){
    if (authenticate(msj.input.name, msj.input.pass)){
        msjs.context.redirect("/msjs/demo/app.msjs?name=" + msj.input.name);
    }

    return false;

});
login.push(submit, "input");

var authError = msjs.make(function(msj){
    if (!msj.login){
        form.className = "error";
    }
});
authError.push(login, "login");

var dom = msjs.require("msjs.dom");
document.addCss(form.getCssId() + ".error", dom.find(form, "input[name=pass]"), {
    backgroundColor : "red"
});
