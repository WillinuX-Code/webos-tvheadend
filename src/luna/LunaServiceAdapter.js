import '@procot/webostv/webOSTV';

/**
 * Depending on local development or emulator usage
 * the service bridge is differen
 * - local js => java object reference
 * - local + webos emulator => luna service bus
 */
export default class LunaServiceAdapter {
    /**
     * returns promise
     * 
     * @param {String} method 
     * @param {Object} params 
     */
    call(method, params) {
        return new Promise(function(resolve, reject) {
            console.log('lsa:%s start', method);
            let lunareq = global.webOS.service.request('luna://com.willinux.tvh.app.proxy', {
                method: method,
                parameters: params,
                onSuccess: (res) => resolve(res),
                onFailure: (res) => reject(res),
                onComplete: function () {
                    console.log('lsa:%s end', method);
                }
            });
        });
    }

    toast(message) {
        console.log('lsa:toast start');
        let lunareq = global.webOS.service.request('luna://com.webos.notification', {
            method: "createToast",
            parameters: {
                message: message
            },
            onSuccess: function (res) {
                console.log("succesfully created toast");
            },
            onFailure: function (res) {
                console.log("failed to create toast");
            },
            onComplete: function () {
                console.log("lsa:toast end");
            }
        });
    }

    getLocaleInfo() {
        return new Promise(function(resolve, reject) {
            let lunareq = global.webOS.service.request("luna://com.webos.settingsservice", {
                method: "getSystemSettings",
                parameters: {
                    "keys": ["localeInfo"]
                },
                onSuccess: (res) => resolve(res),
                onFailure: (res) => reject(res)
            });
        });
    }
}