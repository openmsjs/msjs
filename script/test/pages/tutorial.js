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

var form = $(<form>
    <label> String to encrypt:
        <input name="userString"/>
    </label>
    <input type="submit" value="Go"/>
</form>).appendTo("body");

var submit = msjs();
form.submit(function(){
    submit(form.find("input").val());
});

var MD5er = new Packages.org.msjs.service.MD5();
var encrypt = msjs(function(){
    return MD5er.encrypt(submit());
}).depends(submit);

var output = $(<div><span>MD5 hash key is: </span><span/></div>).appendTo(document.body);
//FIXME: Unless this value is assigned, the dotrenderer messes up
var renderer = msjs(function(){
    output.find("span").last().text(encrypt());
}).depends(encrypt);
