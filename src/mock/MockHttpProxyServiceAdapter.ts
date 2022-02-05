import channelMock from './channels.json';
import epgMock from './epg.json';
import upcomintRecordingMock from './recordings.upcoming.json';
import recordingsMock from './recordings.json';
import channelTagsMock from './channelTags.json';
import channelM3UMock from './channels.m3u.json';

/**
 * Depending on local development or emulator usage
 * the service bridge is differen
 * - local js => java object reference
 * - local + webos emulator => luna service bus
 */
export default class MockHttpProxyServiceAdapter implements HttpProxyInterface {
    async call<TResult>(params: ProxyRequestParams): Promise<TResult> {
        console.log('lsa:%s start');
        const url = params.url;
        if (url.includes('api/channel/grid')) {
            return Promise.resolve((channelMock.result as unknown) as TResult);
        } else if (url.includes('api/epg/events/grid')) {
            return Promise.resolve((epgMock as unknown) as TResult);
        } else if (url.includes('api/dvr/entry/grid_upcoming')) {
            return (Promise.resolve(upcomintRecordingMock as unknown) as unknown) as TResult;
        } else if (url.includes('api/dvr/entry/grid_finished')) {
            return (Promise.resolve(recordingsMock as unknown) as unknown) as TResult;
        } else if (url.includes('api/channeltag/list')) {
            return (Promise.resolve(channelTagsMock.result as unknown) as unknown) as TResult;
        } else if (url.includes('playlist/auth/channels') || url.includes('playlist/channels')) {
            return (Promise.resolve(channelM3UMock.result as unknown) as unknown) as TResult;
        } else if (url.includes('api/dvr/config/grid')) {
            return (Promise.resolve({
                total: 2,
                entries: [
                    {
                        uuid: 'somefakeUuid',
                        enabled: true,
                        name: ''
                    },
                    {
                        uuid: 'anotherDisabledOne',
                        enabled: false,
                        name: 'aName'
                    }
                ]
            } as unknown) as unknown) as TResult;
        } else if (url.includes('/api/serverinfo')) {
            return (Promise.resolve({
                sw_version: '4.3-1919~g52b255940',
                api_version: 19,
                name: 'Tvheadend',
                capabilities: [
                    'caclient',
                    'tvadapters',
                    'satip_client',
                    'satip_server',
                    'timeshift',
                    'trace',
                    'libav',
                    'caclient_advanced'
                ]
            } as unknown) as unknown) as TResult;
        } else if (url.includes('/api/profile/list')) {
            return (Promise.resolve({
                entries: [
                    {
                        key: '37e63ea3fcda682086adaab175dde991',
                        val: 'pass'
                    },
                    {
                        val: 'matroska',
                        key: '03663b00383b34a6ce2a621733388bf5'
                    },
                    {
                        val: 'webtv-h264-aac-mpegts',
                        key: 'b90da9e0bc0633515b261714a966910d'
                    }
                ]
            } as unknown) as unknown) as TResult;
        } else if (url.includes('/stream/channelid')) {
            return (Promise.resolve({
                returnValue: true,
                statusCode: 200
            } as unknown) as unknown) as TResult;
        } else {
            return Promise.reject({
                returnValue: false,
                errorText: 'Unknown url ' + url
            } as ProxyErrorResponse);
        }
        console.log('lsa:%s end');
    }
}
