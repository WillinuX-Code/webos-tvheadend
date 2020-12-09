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
        switch(method) {
            case 'setConfig': 
                onsuccess({"returnValue": true});
                break;
            case 'getChannels':
                onsuccess(channelMock);
                break;
            case 'getEpg':
                onsuccess(epgMock);
                break;
            default:
                onerror({"returnValue": false, "errorText": "Unknown method "+method});
        }
        console.log('lsa:%s end', method); 
        
    }
}