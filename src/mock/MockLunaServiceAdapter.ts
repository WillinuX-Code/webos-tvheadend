/**
 * Depending on local development or emulator usage
 * the service bridge is differen
 * - local js => java object reference
 * - local + webos emulator => luna service bus
 */
export default class MockLunaServiceAdapter implements LunaServiceInterface {
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

    async getDeviceInfo() {
        return {
            returnValue: true,
            modelName: 'webOS TV',
            firmwareVersion: '04.71.25',
            sdkVersion: '4.4.0'
        } as DeviceInfoSuccessResponse;
    }
}
