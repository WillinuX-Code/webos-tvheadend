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
                    total: 2,
                    entries: [
                        {
                            uuid: "somefakeUuid",
                            enabled: true,
                            name: ""
                        },
                        {
                            uuid: "anotherDisabledOne",
                            enabled: false,
                            name: "aName",
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
        else if (url.includes('/api/profile/list')) {
            return {
                returnValue: true,
                result: {
                    "entries": [
                        {
                            "key": "37e63ea3fcda682086adaab175dde991",
                            "val": "pass"
                        },
                        {
                            "val": "matroska",
                            "key": "03663b00383b34a6ce2a621733388bf5"
                        },
                        {
                            "val": "webtv-h264-aac-mpegts",
                            "key": "b90da9e0bc0633515b261714a966910d"
                        }
                    ]
                }
            }
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