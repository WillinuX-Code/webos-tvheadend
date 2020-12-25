import channelMock from './channels.json';
import epgMock from './epg.json';
import recordingMock from './recordings.json';
/**
 * Depending on local development or emulator usage
 * the service bridge is differen
 * - local js => java object reference
 * - local + webos emulator => luna service bus
 */
export default class MockServiceAdapter {
    call(method, params, onsuccess, onerror) {
        console.log('lsa:%s start', method);
        let url = params.url;
        if(url.includes('api/channel/grid')) {
            onsuccess(channelMock);
        }
        else if(url.includes('api/epg/events/grid')) {
            onsuccess(epgMock);
        } 
        else if(url.includes('api/dvr/entry/grid_upcoming')) {
            onsuccess(recordingMock);
        } 
        else if(url.includes('api/dvr/config/grid')) {
            onsuccess({
                returnValue: true,
                result: {
                    total: 1,
                    entries: [
                        {
                            uuid: "somefakeUuid"
                        }
                    ]
                }
            });
        } 
        else {
            onerror({"returnValue": false, "errorText": "Unknown url "+url});
        }
        console.log('lsa:%s end', method);
    }

    toast(message, onsuccess, onerror) {
        console.log('lsa:toast start');
       
        onsuccess({
            returnValue: true
        });
    }

    getLocaleInfo(onsuccess) {
        onsuccess({
            returnValue: true,
            settings: {
                localeInfo: {
                    locales: [{
                        UI: "de_DE"
                    }]
                }
            }
        });
    }
}