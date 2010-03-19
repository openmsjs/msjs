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

var dom = msjs.require("msjs.dom");
document.body.appendChild(dom.make(<h1>Welcome, please log in</h1>));
var form = document.body.appendChild(dom.make(<form>
    <label>Username:
        <input name="username"/>
    </label>
    <label>Password:
        <input name="password" type="password"/>
    </label>
    <input type="submit" value="go"/>
</form>));

var submit = dom.handle("onsubmit", form, function(){
    return{
        name : form.username.value,
        pass : form.password.value
    };
});

var authenticate = msjs.require("demo.authenticate");
var login = msjs.make(function(msj){
    if (authenticate(msj.input.name, msj.input.pass)){
        msjs.log("good login", msj.input.name);
        msjs.context.redirect("/msjs/demo/app.msjs?name=" + msj.input.name);
    } else return false;
});
login.push(submit, "input");

var error = msjs.make(function(msj){
    if (!msj.login) form.className = "error";
});
error.push(login, "login");

document.addCss(form.getCssId() + ".error", "input[name=password]",{
    backgroundColor : "red"
});
