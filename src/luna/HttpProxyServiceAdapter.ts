import '@procot/webostv/webOSTV';

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
}
