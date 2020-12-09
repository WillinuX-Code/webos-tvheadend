import channelMock from './channels.json';
import epgMock from './epg.json';
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
        else {
            onerror({"returnValue": false, "errorText": "Unknown url "+url});
        }
        console.log('lsa:%s end', method);
    }
}