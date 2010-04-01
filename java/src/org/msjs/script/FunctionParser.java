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

import com.google.inject.Inject;
import com.google.inject.Singleton;
import org.apache.log4j.Logger;
import org.mozilla.javascript.CompilerEnvirons;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.ContextFactory;
import org.mozilla.javascript.ErrorReporter;
import org.mozilla.javascript.EvaluatorException;
import org.mozilla.javascript.Function;
import org.mozilla.javascript.Node;
import org.mozilla.javascript.Parser;
import org.mozilla.javascript.ScriptOrFnNode;
import org.mozilla.javascript.ScriptableObject;
import org.mozilla.javascript.Token;

import java.util.HashSet;
import java.util.Map;
import java.util.Set;

@Singleton
public class FunctionParser {
    private final ContextFactory cxFactory;
    private static final Object[] emptyList = {};
    private static final Logger logger = Logger.getLogger(FunctionParser.class);

    @Inject
    public FunctionParser(ContextFactory cxFactory) {
        this.cxFactory = cxFactory;
    }

    public Set<String> getFreeVariables(Function f) {
        ScriptOrFnNode firstFunction = null;
        try{
            ScriptOrFnNode node = getParser().parse(getFunctionSource(f), "closure generator", 0);
            firstFunction = node.getFunctionNode(0);
        } catch (Exception e){
            logger.error("Can't find function in " + f);
        }
        return getFreeVariablesInFunction(firstFunction);
    }

    private String getFunctionSource(final Function f) {
        return (String) ScriptableObject.callMethod(f, "toString", emptyList);
    }

    private Parser getParser() {
        try{
            final CompilerEnvirons env = new CompilerEnvirons();
            env.initFromContext(cxFactory.enterContext());
            return new Parser(env, reporter);
        } finally{
            Context.exit();
        }
    }

    private Set<String> getFreeVariablesInFunction(final ScriptOrFnNode fn) {
        Set<String> varNames = new HashSet<String>();
        if (fn != null){
            addVarNames(fn, varNames);

            for (int i = 0; i < fn.getFunctionCount(); i++){
                varNames.addAll(getFreeVariablesInFunction(fn.getFunctionNode(i)));
            }

            final Map<String, ? extends Object> symbolTable = fn.getSymbolTable();
            if (symbolTable != null) varNames.removeAll(symbolTable.keySet());
        }

        return varNames;
    }

    private void addVarNames(final Node fn, final Set<String> vars) {
        if (fn.getType() == Token.NAME || fn.getType() == Token.BINDNAME){
            vars.add(fn.getString());
        }

        for (Node child = fn.getFirstChild(); child != null;){
            addVarNames(child, vars);
            child = child.getNext();

        }

    }

    private final ErrorReporter reporter = new ErrorReporter() {

        public void warning(final String message, final String sourceName, final int line,
                            final String lineSource,
                            final int lineOffset) {
        }

        public void error(final String message, final String sourceName, final int line,
                          final String lineSource,
                          final int lineOffset) {
        }

        public EvaluatorException runtimeError(final String message, final String sourceName,
                                               final int line,
                                               final String lineSource, final int lineOffset) {
            return null;
        }
    };

}
