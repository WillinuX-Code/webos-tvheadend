var http = require("http");
var Service = require("webos-service");

var service = new Service("com.willinux.tvh.app.proxy"); // code to keep the service from being terminated
service.activityManager.idleTimeout = 60;
/*var keepAlive;
service.activityManager.create("keepAlive", function(activity) {
    keepAlive = activity;
});
service.activityManager.complete(keepAlive, function(activity) { 
    console.log("completed activity"); 
});*/

/**
 * backend proxy for requests to tvheadend as they are
 * not possible from browser due to cors restrictions
 */
service.register("proxy", function (message) {
    var url = message.payload.url;
    
    //var user = message.payload.user;
    //var password = message.payload.password;

    // var options = {
    //     timeout: 2000
    // }
    var req = http.get(url, function (resp) {
        var data = '';
        // handle http status
        if(resp.statusCode < 200 || resp.statusCode > 299) {
            message.respond({
                "returnValue": false,
                "errorText": "Server answered with StatusCode "+resp.statusCode,
                "errorCode": 1
            });
        } else {
            // A chunk of data has been recieved.
            resp.on('data', (chunk) => {
                data += chunk;
            });
            // The whole response has been received. Print out the result.
            resp.on('end', function () {
                message.respond({
                    "returnValue": true,
                    "result": JSON.parse(data)
                });
            });
        }

    }).on("error", function (err) {
        message.respond({
            "returnValue": false,
            "errorText": err.message,
            "errorCode": 1
        });
    }).on("socket", function (socket) {
        socket.setTimeout(2000);  
        socket.on('timeout', function() {
            req.destroy();
        });
    });
    req.setTimeout(2000, function() {                                                                                                                                                                                                                                              
        req.destroy();                                                                                                                                               
    });
});
