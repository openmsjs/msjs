var queue = new java.util.concurrent.LinkedBlockingQueue(20);

msjs.publish({
    add : function(el){
        while (!queue.offer(el)){
            queue.poll();
        }
        return this.get();
    },
    get : function(){
        return msjs.map(queue);
    }
}, "Singleton");
