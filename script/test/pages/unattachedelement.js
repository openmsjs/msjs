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

var el = document.createElement(<div>unattached element</div>);

var a = msjs(function() {});
var b = msjs(function() {});
a.el = el;
b.el = el;

var assert = msjs.require("msjs.assert");
b.onLoad = function() {
    assert("element not set", this.el != null);
    assert("element mismatch", this.el == a.el);

    // el is overridden below
    assert("closed element equal to member", el != this.el);
}



el = document.body.appendChild(document.createElement(<div>was attached</div>));
document.body.removeChild(el);
var c = msjs(function() {});
c.el = el;
c.onLoad = function() {
    assert("element not set", el != null);
    assert("closed element not equal to member", el == this.el);
}
