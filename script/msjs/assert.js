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

msjs.publish(function(){
    var val = arguments[arguments.length-1];
    var f = null;

    if (typeof val == "function"){
        f = val;
        val = val();
    }

    if (!val) {
        var description = arguments.length > 1 ? arguments[0] : 
                          (f ? f.toString() : "Failed assertion");

        if (msjs.context.isclient) {
            var el = document.body.appendChild(document.createElement("h1"));
            el.style.color = "red";
            el.appendChild(document.createTextNode("Failed: " + description));
        }

        throw description;
    }
}, "Client");
