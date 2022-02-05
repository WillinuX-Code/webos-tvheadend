import EPGChannel from '../models/EPGChannel';
import { restoreEpgDataFromCache, ChannelEvents } from '../utils/EPGCache';
import Config from '../config/Config';

export interface TVHDataServiceParms {
    tvhUrl: string;
    user: string;
    password: string;
    dvrUuid: number;
}

interface EPGCallback<T extends EPGChannel = EPGChannel> {
    (channels: T[]): void;
}

export default class EPGCacheService {
    private fileServiceAdapter = Config.fileServiceAdapter;

    handleEpgCache(channels: EPGChannel[], callback: EPGCallback) {
        // try to retrieve cached epg to display past events as well
        let cacheResult: {
            channels: EPGChannel[];
            channelEvents: ChannelEvents;
        };
        this.fileServiceAdapter
            .readEpgCache<ChannelEvents>()
            .then((epgCacheResult) => {
                //console.log('Read epg cache was successful:', epgCacheResult.result);
                // restore cached EPG data
                cacheResult = restoreEpgDataFromCache(epgCacheResult.result, channels);
                // notify calling component
                callback(cacheResult.channels);
                // safe new result to disk
                this.fileServiceAdapter
                    .writeEpgCache(cacheResult.channelEvents)
                    .then(() => console.log('epg cache successfully updated'))
                    .catch((error) => console.log('Failed to write epg cache data:', error.errorText));
            })
            .catch((e) => {
                console.log('Failed to load Epg cache:', e.errorText);
                cacheResult = restoreEpgDataFromCache({} as ChannelEvents, channels);
                // notify calling component
                callback(cacheResult.channels);
                // safe new result to disk
                this.fileServiceAdapter
                    .writeEpgCache(cacheResult.channelEvents)
                    .then(() => console.log('epg cache successfully updated'))
                    .catch((error) => console.log('Failed to write epg cache data:', error.errorText));
            });
    }
}
