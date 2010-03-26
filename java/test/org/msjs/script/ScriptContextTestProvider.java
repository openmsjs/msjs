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

import com.google.inject.Binder;
import com.google.inject.Guice;
import com.google.inject.Injector;
import com.google.inject.Module;
import com.google.inject.Provider;
import org.msjs.config.MsjsConfiguration;
import org.msjs.config.BasicConfiguration;

public class ScriptContextTestProvider implements Provider<MsjsScriptContext> {
    Injector injector = Guice.createInjector(new Module() {
        @Override
        public void configure(final Binder binder) {
            binder.bind(MsjsConfiguration.class).toInstance(BasicConfiguration.getConfiguration());
        }
    });

    public MsjsScriptContext get() {
        return injector.getInstance(MsjsScriptContext.class);
    }
}
