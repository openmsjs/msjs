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

msjs.require("document");
var dom = msjs.require("msjs.dom");
//Return a string representation of the current msjs.graph in DOT
//language
msjs.publish({dotRender: function(){
    var lines = [];
    var graph = msjs.require("msjs.graph");

    function getNodeName(node){
        var localName = node._debugRef || "node";
        return '"' + localName + "#" + node.getId() + '"';
    }

    function getDomElementName(domel){
        if (domel == document.documentElement) return "document";
        var s = '"'  + dom.getCssId(domel);
        if (domel._debugRef) s += " " + domel._debugRef;
        return s + '"';
        
    }

    function printNode(node){
        var s = getNodeName(node);
        var style = ["fontcolor=gray20"];
        if (!node.isLocal) style.push("fillcolor=gray90", "style=filled");

        if (style.length){
            s += "[" + style.join(",") + "]";
        }
        return s + ";";
    }

    var domelements = [document.documentElement];
    var clusters = {};

    function addDomRelationship(nodeName, el, invert){
        if (domelements.indexOf(el) == -1) domelements.push(el);
        var head = invert ? "inv" : "normal";
        var line = nodeName + " -> " + getDomElementName(el) + 
                    "[arrowhead="+head+", color=gray50];";
        if (lines.indexOf(line) > -1) return;
        lines.push(line);
    }


    msjs.each(graph._nodes, function(node){
        var nodeName = getNodeName(node);

        function processFreeVars(f, invert){
            if (!f) return;
            var freeVars = msjs.context.getFreeVariables(f);
            for (var k in freeVars){
                var val =freeVars[k];
                if (val == jQuery) continue;

                if (val && val instanceof jQuery.fn){
                    val.each(function(n, el){
                        addDomRelationship(nodeName, el, false);
                    });


                }

                //FIXME -- use instanceof here
                if (val && val.nodeName){
                    addDomRelationship(nodeName, val, false);
                }
            }
        }
        processFreeVars(node.produceMsj, false);
        processFreeVars(node._updateF, true);
    });


    //run the graph, in case this installs jQuery handlers or something
    graph.refreshAll();

    //inspect the jQuery cache for to see if any handlers refer
    //to msjs nodes
    msjs.each(jQuery._msjs_getEvents(), function(eventInfo){
        var el, handler;
        msjs.each(eventInfo, function(arg){
            if (!arg) return;
            if (arg && arg.nodeName){
                el = arg;
            } else if (typeof arg == "function"){
                handler = arg;
            }
        });

        var freeVars = msjs.context.getFreeVariables(handler);
        for (var k in freeVars){
            var val =freeVars[k];
            if (val && val._debugRef && val.getId ){
                    //it's a node (more or less);
                    addDomRelationship(getNodeName(val), el, true);
                }
            }
    });

    graph.pack();
    document.renderAsXHTML();


    var length = graph._adjacencyMatrix.length;
    for (var i=0; i < length; i++){
        var row = graph._adjacencyMatrix[i];
        var node = graph._nodes[i];
        var nodeName = getNodeName(node);
        
        var nodePackage = node._packageName;
        if (nodePackage){
            if (!clusters[nodePackage]){
                clusters[nodePackage] = [];
            }
            clusters[nodePackage].push(printNode(node));
        } else {
            lines.push(printNode(node));
        }

        var postfix = "";

        var outEdges = 0;
        for (var k in row){ outEdges++; }

        var lightArrows = outEdges > 5;

        for (var k in row){
            var rightSide = getNodeName(graph._nodes[k]);

            var line = nodeName + " -> " + rightSide + postfix;
            if (lightArrows) line += "[color=gray80]";
            else line += "[weight=2]";
            line += ";"
            lines.push(line);
        }
    }

    var clusterLines = [];
    var clusterCount = 0;
    for (var k in clusters){
        clusterLines.push("subgraph cluster" + clusterCount++ +" {");
        clusterLines.push("color=black;");
        clusterLines.push("fontcolor=black;");
        clusterLines.push("label= \"" + k +"\";");
        clusterLines = clusterLines.concat(clusters[k]);
        clusterLines.push("}");
    }


    var ranks = [];
    var idHash = {};
    msjs.each(domelements, function(el){
        var elName = getDomElementName(el); 
        if (idHash[elName]) return;
        idHash[elName] = true;
        lines.push( elName + "[shape=box, color=gray50, fontcolor=gray50]" );
        var depth =0;
        var p = el.parentNode;
        while(p != null){
            var i=0;
            while ( i< domelements.length){
                var otherNode = domelements[i++];
                if (otherNode == el) continue;

                if (p == otherNode){
                    depth++;
                    if (depth == 1){
                        lines.push(elName + " -> " + getDomElementName(otherNode) + 
                                   "[arrowhead=dot, color=gray50];");
                    }
                    break;
                }

            }

            p = p.parentNode;

        }

        if (!ranks[depth]) ranks[depth] = [];
        ranks[depth].push(el);
    });

    msjs.each(ranks, function(rank, n){
        var s = "{ rank = same; ";
        msjs.each(rank, function(el){
            s += getDomElementName(el) + "; ";
        });

        lines.push( s + "}");
    });

    lines.push("}");


    return "digraph G {\n" + clusterLines.join("\n") + "\n" + lines.join("\n");
}});
