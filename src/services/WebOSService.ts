import Config from '../config/Config';

export default class WebOSService {
    private lunaServiceAdapter = Config.lunaServiceAdapter;

    /**
     * trigger toast message
     *
     * @param message
     */
    showToastMessage(message: string) {
        this.lunaServiceAdapter.toast(message);
    }

    /**
     * retrieve local information from tv
     */
    async getLocaleInfo() {
        const localeInfo = await this.lunaServiceAdapter.getLocaleInfo();
        // console.log('getLocaleInfo:', localeInfo);
        return localeInfo;
    }
}
