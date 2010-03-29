// Example CouchDB file to use for couchreload. Used to demonstrate syntax
// of reload file.

var databases = msjs.publish({});

databases.user = {
    views: [{
        _id: "_design/user",
        views: {
            by_user : {
                map : function(doc) {
                    emit(doc.userId, null);
                }
            },
            by_id : {
                map : function(doc){
                    emit(doc._id, null);
                }
            }
        }
    }],
    docs: [
        {
            _id: "tom-id",
            userId: "tom",
            password: "tom-password"
        },
        {
            userId: "matt",
            password: "matt-password"
        }
    ]
};

databases.cart = {
    views: [{
        _id: "_design/cart",
        views: {
            by_user : {
                map : function(doc) {
                    emit(doc.userId, null);
                }
            },
            by_item_count : {
                map : function(doc){
                    for (var i=0; i < doc.items.length; i++) {
                        var key = doc.items[i];
                        var val = {};
                        val[key] = 1;
                        emit(key, val);
                    }
                },
                reduce : function(keys, vals, rereduce) {
                    var itemCount = {};
                    var add = function(key, n) {
                        if (itemCount[key]) {
                            itemCount[key] = itemCount[key] + n;
                        } else {
                            itemCount[key] = n;
                        }
                    };
                    for (var i=0; i < vals.length; i++) {
                        var val = vals[i];
                        for (var k in val) {
                            add(k, val[k]);
                        }
                    }
                    return itemCount;
                }
             }
        }
    }],
    docs: [
        {
            userId: "tom",
            items: ["bicycle", "notebook", "pen"]
        },
        {
            userId: "matt",
            items: ["pillow", "bicycle", "computer"]
        },
        {
            userId: "otto",
            items: ["computer", "pillow", "pen", "bicycle"]
        }

    ]
};

databases.empty = {
};