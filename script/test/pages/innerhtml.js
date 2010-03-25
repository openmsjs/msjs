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

var el = $(<div/>).appendTo("body");
var makesome = msjs.make(function(){
    el[0].innerHTML = "foo foo foo";
});


var moreEl = $(<a href="http://google.com">this is the original</a>).appendTo("body");
var makemore = msjs.make( function(){
    moreEl[0].innerHTML = "link to google";
});
