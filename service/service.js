var url = "";

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

    http.get(url, function (resp) {
        var data = '';
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

    }).on("error", function (err) {
        message.respond({
            "returnValue": false,
            "errorText": error.message,
            "errorCode": 1
        });
    });
});
