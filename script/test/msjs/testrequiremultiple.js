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

var arr = msjs.require(
     "test.msjs.includes.set",
     "test.msjs.includes.one",
     "msjs.assert"
);

assert(set instanceof java.lang.Object);
assert(one.isMsjsNode);
assert(arr.length == 3);
assert(arr[0] == set);
assert(arr[1] == one);
