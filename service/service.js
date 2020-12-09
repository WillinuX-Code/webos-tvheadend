var url = "";
var PATH_INITIAL_CHANNELS = "api/channel/grid?dir=ASC&sort=number&start=";
var PATH_EPG = "api/epg/events/grid?dir=ASC&sort=start&limit=500&start=";
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

service.register("setConfig", function (message) {
    url = message.payload.baseUrl;
    message.respond({
        "returnValue": true,
        "result": url
    });
});
service.register("getChannels", function (message) {
    var start = message.payload.start;
    http.get(url + PATH_INITIAL_CHANNELS + start, function (resp) {
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
service.register("getEpg", function (message) {
    var start = message.payload.start;
    http.get(url + PATH_EPG + start, function (resp) {
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
