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

var request = msjs.require("msjs.jsonrequest");

var key = "ABQIAAAAvfYgX1w7gkobOKNZ4EmdoRRU6VKpbhTMt7yIoTcEHcoFunbUEhQuOVhLtnhnNwAcNomN0lxYnbpLBA";
var url = "http://ajax.googleapis.com/ajax/services/search/images?key=" + key + "&v=1.0&rsz=large&q=grover";
var response = request.get(url);
msjs.log(response);
