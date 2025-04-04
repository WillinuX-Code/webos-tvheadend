import '@procot/webostv/webOSTV';
import Config from '../config/Config';

export default class HttpProxyServiceAdapter implements HttpProxyInterface {
    call<T>(params: ProxyRequestParams): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            console.log('lsa:%s start', params.url);
            global.webOS.service.request('luna://com.willinux.tvh.app.proxy', {
                method: 'proxy',
                parameters: params,
                onSuccess: (res: ProxySuccessResponse<string>) => {
                    try {
                        resolve(JSON.parse(res.result) as T);
                    } catch {
                        resolve((res.result as unknown) as T);
                    }
                },
                onFailure: (res: ProxyErrorResponse) => reject(res),
                onComplete: () => {
                    console.log('lsa:%s end', params.url);
                }
            });
        });
    }

   isAvailable(): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            global.webOS.service.request('luna://com.willinux.tvh.app.proxy', {
                method: "ping",
                parameters: {},
                onSuccess: function (res) {
                    if (res.returnValue) {
                        console.log("http proxy is available!");
                        resolve(true);
                    } else {
                        console.log("http proxy not available yet, retrying...");
                        setTimeout(() => {
                            Config.httpProxyServiceAdapter.isAvailable().then(resolve).catch(reject);
                        }, 2000); // Retry in 2 seconds
                    }
                },
                onFailure: function (err) {
                    console.error("Error checking service, retrying...:", err);
                    setTimeout(() => {
                        Config.httpProxyServiceAdapter.isAvailable().then(resolve).catch(reject);
                    }, 2000); // Retry in 2 seconds
                }
            });
        });
    }

}

