import channelMock from './channels.json';
import epgMock from './epg.json';
import recordingMock from './recordings.json';
import channelTagsMock from './channelTags.json';
/**
 * Depending on local development or emulator usage
 * the service bridge is differen
 * - local js => java object reference
 * - local + webos emulator => luna service bus
 */
export default class MockServiceAdapter {

    async call(method, params) {
        console.log('lsa:%s start', method);
        let url = params.url;
        if (url.includes('api/channel/grid')) {
            return channelMock;
        }
        else if (url.includes('api/epg/events/grid')) {
            return epgMock;
        }
        else if (url.includes('api/dvr/entry/grid_upcoming')) {
            return recordingMock;
        }
        else if (url.includes('api/channeltag/list')) {
            return channelTagsMock;
        }
        else if (url.includes('api/dvr/config/grid')) {
            return {
                returnValue: true,
                result: {
                    total: 1,
                    entries: [
                        {
                            uuid: "somefakeUuid"
                        }
                    ]
                }
            };
        }
        else if (url.includes('/api/serverinfo')) {
            return {
                returnValue: true,
                result: {
                    "sw_version": "4.3-1919~g52b255940",
                    "api_version": 19,
                    "name": "Tvheadend",
                    "capabilities": [
                        "caclient",
                        "tvadapters",
                        "satip_client",
                        "satip_server",
                        "timeshift",
                        "trace",
                        "libav",
                        "caclient_advanced"
                    ]
                }
            };
        }
        else {
            return { "returnValue": false, "errorText": "Unknown url " + url };
        }
        console.log('lsa:%s end', method);
    }

    toast(message, onsuccess, onerror) {
        console.log('lsa:toast start');

        onsuccess({
            returnValue: true
        });
    }

    async getLocaleInfo() {
        return {
            returnValue: true,
            settings: {
                localeInfo: {
                    locales: {
                        UI: "de-DE"
                    }
                }
            }
        }
    }
}