import '@procot/webostv/webOSTV';

/**
 * Depending on local development or emulator usage
 * the service bridge is differen
 * - local js => java object reference
 * - local + webos emulator => luna service bus
 */
export default class LunaServiceAdapter {
    call(method, params, onsuccess, onerror) {
        console.log('lsa:%s start', method);
        let lunareq = global.webOS.service.request('luna://com.willinux.tvh.app.proxy', {
            method: method,
            parameters: params,
            onSuccess: function (res) {
                onsuccess(res);
            },
            onFailure: function (res) {
                onerror(res);
            },
            onComplete: function () {
                console.log('lsa:%s end', method);
            }
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

    getLocaleInfo(onsuccess, onerror) {
        let lunareq = global.webOS.service.request("luna://com.webos.settingsservice", {
            method: "getSystemSettings",
            parameters: {
                "keys": ["localeInfo"]
            },
            onSuccess: function (res) {
                onsuccess(res);
            },
            onFailure: function (res) {
                onerror(res);
            },
        });
    }
}