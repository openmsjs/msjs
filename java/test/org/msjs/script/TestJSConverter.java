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

import static org.junit.Assert.*;
import org.junit.Test;
import org.mozilla.javascript.ScriptableObject;
import org.msjs.script.JSConverter;
import org.msjs.script.ScriptContextTestProvider;

import java.io.IOException;
import java.io.StringReader;
import java.util.List;

public class TestJSConverter {
    private final JSConverter jsConverter;

    public TestJSConverter(){
        final ScriptContextTestProvider provider = new ScriptContextTestProvider();
        jsConverter = new JSConverter( provider.get());
    }


    //TODO: test for null members, empty child lists, invalid member types
    //TODO: test for handling of style attribute
    //TODO: test for script block handling

    @Test
    public void JSONTest() throws IOException {
        String json = "{\"name\" : \"foo\", x:77}";

        ScriptableObject obj = (ScriptableObject) jsConverter.fromJSON(new StringReader(json));
        assertEquals(77d, obj.get("x", obj));
        assertEquals("foo", obj.get("name", obj));
    }

    //TODO: Test edge cases in JSConverter.PrependAssignReader

    @Test
    public void testList() throws IOException {
        String json = "[\"foo\", 77, null]";

        ScriptableObject arr = (ScriptableObject) jsConverter.fromJSON(new StringReader(json));
        //make sure it worked as expected -- not the point of this test, though
        assertEquals("foo", arr.get(0, arr));
        assertEquals(77d, arr.get(1, arr));
        assertEquals(null, arr.get(2, arr));

        List list = jsConverter.toList(arr);
        assertEquals(3, list.size());
        assertEquals("foo", list.get(0));
        assertEquals(77d, list.get(1));
        assertEquals(null, list.get(2));
    }

    @Test
    public void testNumericStringKey() throws IOException {
        String json = "{\"updatesFromRemote\":{\"2\":{\"first\":\"aaa\",\"last\":\"bbb\"}},\"clock\":1}";
        ScriptableObject result = (ScriptableObject) jsConverter.fromJSON(new StringReader(json));
        assertNotNull(result);
        ScriptableObject updates = (ScriptableObject) result.get("updatesFromRemote", result);
        assertNotNull(updates);
        //Even though the key is quoted, ScriptableObject needs an int here, or the javascript
        //won't be able to get this key
        Object notTwo =  updates.get("2", updates);
        assertEquals(org.mozilla.javascript.UniqueTag.NOT_FOUND, notTwo);

        ScriptableObject two = (ScriptableObject) updates.get(2, updates);
        assertNotNull(two);

        //TODO: This doesn't test the real issue, which is that if you put the String "2" in as key
        //to a ScriptableObject, it's not accessible from JavaScript, even though you can still
        //get it from the Java side of ScriptableObject
        String first = (String) ((ScriptableObject) two).get("first", two);
        assertEquals("aaa", first);

    }

}
