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

/*! msjs.server-only **/
var map = new java.util.concurrent.ConcurrentHashMap();
var lock = new java.util.concurrent.locks.ReentrantLock();

var copyMatrix = function(ajm){
    var copy = [];
    for (var i=0; i < ajm.length; i++){
        copy[i] = msjs.copy(ajm[i]);
    }
    return copy;
}

var getTC = function(json, ajm){
    lock.lock();
    try{
        //try to get again, in case the value was put between the time
        //this thread blocked on the lock and time this thread acquired
        //the lock
        var tc = map.get(json);

        if (!tc){
            var tc = copyMatrix(ajm);
            var length = tc.length;
            for (var k = 0; k < length; k++){
                for (var i = 0;i <length; i++){
                    for (var j = 0;j < length; j++){
                        var ik = tc[i][k] || 0;
                        var kj = tc[k][j] || 0;
                        var ij = tc[i][j] || 0;

                        if (ik && kj && 
                            ((ik + kj < ij) ||  (ij == 0)) ){
                            if (ik+kj) tc[i][j] = ik + kj;
                        }
                    }
                }
            }
            map.putIfAbsent(json, tc);
        }
    }finally{
        lock.unlock();
    }
}

msjs.publish(function(ajm){
    var json = new java.lang.String(msjs.toJSONWithFunctions(ajm));

    if (!map.containsKey(json)){
        getTC(json, ajm);
    }

    return map.get(json);
}, "Singleton");

