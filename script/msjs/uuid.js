msjs.publish(function() {
    //64 possible characters
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_0123456789';
    //UUID is 128 bits
    //char 1 is  base 16 = 2^4
    //char 2 is  base 16 = 2^4
    //others are base 64 = 2^6
    //128 = 4 + 4 + 6*20

    var uuid = "";
    //first characters are base 16, to make sure that they are letters and not
    //numbers, and thus can be used directly as DOM ids
    for (var i=0; i<22; i++){
        var radix = i < 2 ? 16 : 64;
        uuid += chars.charAt(Math.floor(Math.random() * radix));
    }

    return uuid;
})
