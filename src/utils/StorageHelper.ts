const STORAGE_KEY_LAST_CHANNEL = 'lastChannel';

export default class StorageHelper {
    static getLastChannelIndex = (): number => {
        const indexStr = localStorage.getItem(STORAGE_KEY_LAST_CHANNEL);
        return (indexStr && parseInt(indexStr)) || 0;
    };

    static setLastChannelIndex = (index: number) => {
        localStorage.setItem(STORAGE_KEY_LAST_CHANNEL, index.toString());
    };

    static getLastAudioTrackIndex = (channelName: string): number => {
        const indexStr = localStorage.getItem(channelName);
        return (indexStr && parseInt(indexStr)) || 0;
    };

    static setLastAudioTrackIndex = (channelName: string, index: number) => {
        localStorage.setItem(channelName, index.toString());
    };
}
