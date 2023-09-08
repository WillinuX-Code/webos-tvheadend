import '@procot/webostv/webOSTV';

/**
 * Depending on local development or emulator usage
 * the service bridge is differen
 * - local js => java object reference
 * - local + webos emulator => luna service bus
 */
export default class LunaServiceAdapter implements LunaServiceInterface {
    toast(message: string): void {
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

    getLocaleInfo(): Promise<LocaleInfoSuccessResponse> {
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

    getDeviceInfo(): Promise<DeviceInfoSuccessResponse> {
        return new Promise<DeviceInfoSuccessResponse>(function (resolve, reject) {
            global.webOS.service.request('luna://com.webos.service.tv.systemproperty', {
                method: 'getSystemInfo',
                parameters: {
                    keys: ['modelName', 'firmwareVersion', 'sdkVersion']
                },
                onSuccess: (res: DeviceInfoSuccessResponse) => resolve(res),
                onFailure: (res) => reject(res)
            });
        });
    }
}
