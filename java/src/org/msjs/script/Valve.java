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

package org.msjs.script;

import java.util.concurrent.locks.AbstractQueuedSynchronizer;

/**
 * Synchronizer used for outbound graph messages. Only one thread can open the
 * valve at a time. A single thread will wait to open the valve until it becomes
 * pressurized. If multiple threads to queue up to wait for the valve, newer threads
 * are allowed to open the valve, even if it isn't pressurized.
 */
public class Valve {
    private final Sync sync = new Sync();

    public void pressurize() {
        sync.acquire(0);
        sync.release(0);
    }

    //returns true if valve was pressurized
    public boolean open() throws InterruptedException {
        boolean notMe;
        do{
            sync.acquireInterruptibly(1);
            notMe = sync.stateEquals(3);
            if (notMe){
                sync.release(3);
                Thread.sleep(100);
            }
        }while(notMe);
        return sync.stateEquals(2);
    }

    public void close() {
        //also depressurizes the valve
        sync.release(-1);
    }

    private static class Sync extends AbstractQueuedSynchronizer {
        public Sync(){
            setState(-1);
        }

        //State values:
        //-1: unpressurized
        //0: pressurized
        //1: pressurizing
        //2: opened-after-pressurize
        //3: allow pass-thru (valve is still closed, but another thread is waiting)
        //4: passing thru (thread has opened valve because another thread is waiting)
        public boolean tryAcquire(int action) {
            switch (action) {
                case 0: //pressurize
                    return compareAndSetState(-1, 1) ||
                           compareAndSetState( 0, 1) ||
                           compareAndSetState( 3, 1);
                case 1: //open
                    Thread first = getFirstQueuedThread();
                    if (first == null || first == Thread.currentThread()) {
                        return compareAndSetState(0, 2) || compareAndSetState(3, 4);
                    } else {
                        return compareAndSetState(-1, 3);
                    }
                default:
                    throw new RuntimeException("Unreachable");
            }
        }

        public boolean stateEquals(int state){
            return getState() == state;
        }

        // Release the lock and update the state
        protected boolean tryRelease(int newState) {
            setState(newState);
            return true;
        }


    }
}
