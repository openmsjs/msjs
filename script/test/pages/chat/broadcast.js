var connection = msjs.publish(
    msjs.require("msjs.connection").make(
        function(node){
            return this.getAllConnected();
        }
    ),
"Singleton");
