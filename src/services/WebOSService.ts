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
        return localeInfo;
    }

    async getDeviceInfo() {
        const deviceInfo = await this.lunaServiceAdapter.getDeviceInfo();
        return deviceInfo;
    }
}
