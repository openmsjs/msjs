var connection = msjs.publish(
    msjs.connection(function(node){
        return this.getAllConnected();
    }),
"Singleton");
