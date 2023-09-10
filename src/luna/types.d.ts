interface EpgSuccessResponse<TResult> extends WebOSTV.OnCompleteSuccessResponse {
    result: TResult;
}

interface ProxyRequestParams {
    url: string;
    user?: string;
    password?: string;
    method?: string;
}

interface ProxySuccessResponse<TResult> extends WebOSTV.OnCompleteSuccessResponse {
    result: TResult;
    statusCode: number;
}

interface ProxyErrorResponse extends WebOSTV.OnCompleteFailureResponse {
    errorText: string;
    statusCode?: number;
}

interface EpgSuccessResponse<TResult> extends WebOSTV.OnCompleteSuccessResponse {
    result: TResult;
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

interface ConnectionMgrResponse extends WebOSTV.OnCompleteSuccessResponse {
    isInternetConnectionAvailable: boolean;
    wired: NetworkDetails;
    wifi: NetworkDetails;
    wifiDirect: NetworkDetails;
}

interface NetworkDetails {
    state: string;
}

interface DeviceInfoSuccessResponse extends WebOSTV.OnCompleteSuccessResponse {
    modelName: string;
    firmwareVersion: string;
    sdkVersion: string;
}

interface LunaServiceInterface {
    toast(message: string): void;
    getLocaleInfo(): Promise<LocaleInfoSuccessResponse>;
    getDeviceInfo(): Promise<DeviceInfoSuccessResponse>;
    getNetworkInfo(): Promise<ConnectionMgrResponse>;
}

interface FileServiceInterface {
    writeEpgCache(data: unknown): Promise<WebOSTV.OnCompleteSuccessResponse>;
    readEpgCache<T>(): Promise<EpgSuccessResponse<T>>;
}

interface HttpProxyInterface {
    call<T>(params: ProxyRequestParams): Promise<T>;
}
