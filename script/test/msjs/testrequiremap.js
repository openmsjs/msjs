msjs.require({
    set : "test.msjs.includes.set",
    oneNode : "test.msjs.includes.one",
    assert : "msjs.assert",
    node : "msjs.node"
});

assert(set instanceof java.lang.Object);
assert(oneNode instanceof node);
