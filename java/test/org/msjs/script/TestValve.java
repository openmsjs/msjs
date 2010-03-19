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

import org.junit.Before;
import org.junit.Test;
import org.apache.log4j.Logger;
import static junit.framework.Assert.assertEquals;

import java.util.concurrent.CountDownLatch;
import java.util.List;
import java.util.ArrayList;

public class TestValve {
    private Valve valve;
    private List<String> output;

    private static final Logger logger = Logger.getLogger(TestValve.class);

    @Before
    public void setup() {
        valve = new Valve();
        output = new ArrayList<String>();
    }

    @Test
    public void testPressurize() throws InterruptedException {
        CountDownLatch done = makeOutputter("one");
        Thread.sleep(100);
        assertEquals(0, output.size());
        valve.pressurize();
        done.await();
        assertEquals(2, output.size());
        assertEquals("one", output.get(0));
        assertEquals("true", output.get(1));
    }

    @Test
    public void testFIFO() throws InterruptedException {
        CountDownLatch oneDone = makeOutputter("one");
        Thread.sleep(100); //sleep before assertions to make sure other thread isn't running
        assertEquals(0, output.size());
        CountDownLatch twoDone = makeOutputter("two");
        oneDone.await();
        Thread.sleep(100);
        assertEquals(2, output.size());
        assertEquals("one", output.get(0));
        assertEquals("false", output.get(1));
        valve.pressurize();
        twoDone.await();
        assertEquals(4, output.size());
        assertEquals("two", output.get(2));
        assertEquals("true", output.get(3));

                                             
    }

    private CountDownLatch makeOutputter(final String name) {
        final CountDownLatch done = new CountDownLatch(1);
        Thread thread = new Thread(new Runnable() {
            @Override
            public void run() {
                boolean didOpen = false;
                try{
                    didOpen = valve.open();
                } catch (InterruptedException e){
                    logger.info(e);
                }
                output.add(name);
                output.add(didOpen ? "true" : "false");
                valve.close();
                done.countDown();
            }
        });
        thread.start();
        return done;
    }

}