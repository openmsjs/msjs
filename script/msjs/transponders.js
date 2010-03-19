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

var maker = new Packages.com.google.common.collect.MapMaker();
var transponderMap = maker.weakValues().makeMap();
//TODO: tweak settings
var executor = msjs.require("java.java.util.concurrent.ExecutorService");
msjs.publish({
    register : function(transponder){
        transponderMap.put(transponder.getGraphId(), transponder);
    },
    send : function(graphId, channels){
        var otherTransponder = transponderMap.get(graphId);
        if (otherTransponder){
            executor.submit( new java.lang.Runnable({
                run : function(){
                    try {
                        otherTransponder.acceptTransmission(channels);
                    } catch (e){
                        var errorMsg = 'Error in switchboard send';
                        if (e.rhinoException){
                            msjs.context.log(errorMsg, e.rhinoException);
                        } else {
                            msjs.log(errorMsg, e);
                        }
                    }
                }
            }));
        }
    }
}, "Singleton");
