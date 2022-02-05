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
}
