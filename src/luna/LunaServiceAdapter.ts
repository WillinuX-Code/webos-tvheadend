import '@procot/webostv/webOSTV';

interface ProxyRequestParams {
    url: string;
    user?: string;
    password?: string;
    method?: string;
}

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
export default class LunaServiceAdapter {
    call<T>(params: ProxyRequestParams) {
        return new Promise<T>((resolve, reject) => {
            console.log('lsa:%s start', params.url);
            global.webOS.service.request('luna://com.willinux.tvh.app.proxy', {
                method: 'proxy',
                parameters: params,
                onSuccess: (res: ProxySuccessResponse<string>) => {
                    try {
                        resolve(JSON.parse(res.result) as T);
                    } catch {
                        resolve(res.result as unknown as T);
                    }
                },
                onFailure: (res: ProxyErrorResponse) => reject(res),
                onComplete: () => {
                    console.log('lsa:%s end', params.url);
                }
            });
        });
    }

    writeEpgCache(data: any) {
        return new Promise<WebOSTV.OnCompleteSuccessResponse>((resolve, reject) => {
            console.log('lsa: write epg cache');
            global.webOS.service.request('luna://com.willinux.tvh.app.proxy', {
                method: 'fileIO',
                parameters: { filename: 'epgcache.json', write: true, data: data },
                onSuccess: (res: WebOSTV.OnCompleteSuccessResponse) => resolve(res),
                onFailure: (res: ProxyErrorResponse) => reject(res),
                onComplete: () => {
                    console.log('lsa: write epg cache end');
                }
            });
        });
    }

    readEpgCache<T>() {
        return new Promise<EpgSuccessResponse<T>>((resolve, reject) => {
            console.log('lsa: read epg cache');
            global.webOS.service.request('luna://com.willinux.tvh.app.proxy', {
                method: 'fileIO',
                parameters: { filename: 'epgcache.json', read: true },
                onSuccess: (res: EpgSuccessResponse<T>) => resolve(res),
                onFailure: (res: ProxyErrorResponse) => reject(res),
                onComplete: () => {
                    console.log('lsa: read epg cache end');
                }
            });
        });
    }

    toast(message: string) {
        console.log('lsa:toast start');
        global.webOS.service.request('luna://com.webos.notification', {
            method: 'createToast',
            parameters: {
                message: message
            },
            onSuccess: () => {
                console.log('succesfully created toast');
            },
            onFailure: () => {
                console.log('failed to create toast');
            },
            onComplete: () => {
                console.log('lsa:toast end');
            }
        });
    }

    getLocaleInfo() {
        return new Promise<LocaleInfoSuccessResponse>(function (resolve, reject) {
            global.webOS.service.request('luna://com.webos.settingsservice', {
                method: 'getSystemSettings',
                parameters: {
                    keys: ['localeInfo']
                },
                onSuccess: (res: LocaleInfoSuccessResponse) => resolve(res),
                onFailure: (res) => reject(res)
            });
        });
    }
}
