import channelMock from './channels.json';
import epgMock from './epg.json';
import upcomintRecordingMock from './recordings.upcoming.json';
import recordingsMock from './recordings.json';
import channelTagsMock from './channelTags.json';
import channelM3UMock from './channels.m3u.json';
interface EpgSuccessResponse<TResult> extends WebOSTV.OnCompleteSuccessResponse {
    result: TResult;
}
interface ProxySuccessResponse<TResult> extends WebOSTV.OnCompleteSuccessResponse {
    result: TResult;
    statusCode: number;
}

interface ProxyErrorResponse extends WebOSTV.OnCompleteFailureResponse {
    errorText: string;
    statusCode?: number;
}

interface LocaleInfoSuccessResponse extends WebOSTV.OnCompleteSuccessResponse {
    method: string;
    settings: {
        localeInfo: {
            clock: string;
            keyboards: string[];
            locales: {
                UI: string;
                TV: string;
                FMT: string;
                NLP: string;
                STT: string;
                AUD: string;
                AUD2: string;
            };
            timezone: string;
        };
    };
    subscribed: boolean;
}

/**
 * Depending on local development or emulator usage
 * the service bridge is differen
 * - local js => java object reference
 * - local + webos emulator => luna service bus
 */
export default class MockServiceAdapter {
    async call<TResult = any>(params: any) {
        console.log('lsa:%s start');
        const url = params.url;
        if (url.includes('api/channel/grid')) {
            return channelMock as ProxySuccessResponse<any>;
        } else if (url.includes('api/epg/events/grid')) {
            const value = JSON.stringify(epgMock);
            return {
                returnValue: true,
                result: value
            };
            //return epgMock;
        } else if (url.includes('api/dvr/entry/grid_upcoming')) {
            const value = JSON.stringify(upcomintRecordingMock);
            return {
                returnValue: true,
                result: value
            };
        } else if (url.includes('api/dvr/entry/grid_finished')) {
            const value = JSON.stringify(recordingsMock);
            return {
                returnValue: true,
                result: value
            };
        } else if (url.includes('api/channeltag/list')) {
            return channelTagsMock as ProxySuccessResponse<any>;
        } else if (url.includes('playlist/auth/channels') || url.includes('playlist/channels')) {
            return channelM3UMock as ProxySuccessResponse<any>;
        } else if (url.includes('api/dvr/config/grid')) {
            return {
                returnValue: true,
                result: JSON.stringify({
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
                })
            } as ProxySuccessResponse<any>;
        } else if (url.includes('/api/serverinfo')) {
            return {
                returnValue: true,
                result: JSON.stringify({
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
                })
            } as ProxySuccessResponse<any>;
        } else if (url.includes('/api/profile/list')) {
            return {
                returnValue: true,
                result: JSON.stringify({
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
                })
            } as ProxySuccessResponse<any>;
        } else if (url.includes('/stream/channelid')) {
            return {
                returnValue: true,
                statusCode: 200
            };
        } else {
            throw {
                returnValue: false,
                errorText: 'Unknown url ' + url
            } as ProxyErrorResponse;
        }
        console.log('lsa:%s end');
    }

    async writeEpgCache(data: any): Promise<WebOSTV.OnCompleteSuccessResponse> {
        return { returnValue: true };
    }

    async readEpgCache(): Promise<EpgSuccessResponse<any>> {
        return { returnValue: true, result: {} };
    }

    toast(message: string) {
        console.log('lsa:toast start', message);
    }

    async getLocaleInfo() {
        return {
            returnValue: true,
            settings: {
                localeInfo: {
                    locales: {
                        UI: 'de-DE'
                    }
                }
            }
        } as LocaleInfoSuccessResponse;
    }
}
