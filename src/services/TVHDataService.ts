import LunaServiceAdapter from '../luna/LunaServiceAdapter';
//import MockServiceAdapter from '../mock/MockServiceAdapter';
import EPGChannel from '../models/EPGChannel';
import EPGEvent from '../models/EPGEvent';
import M3UParser from '../utils/M3UParser';
import { restoreEpgDataFromCache, ChannelEvents } from '../utils/EPGCache';

export interface TVHDataServiceParms {
    tvhUrl: string;
    user: string;
    password: string;
    dvrUuid: number;
}

interface TVHServerInfo {
    sw_version: string;
    api_version: number;
    name: string;
    capabilities: string[];
}
interface TVHEvents {
    entries: TVHEventEntry[];
    totalCount: number;
}

interface TVHEventEntry {
    eventId: number;
    start: number;
    stop: number;
    title: string;
    description: string;
    subtitle: string;
    channelUuid: string;
}

interface TVHRecordings {
    entries: TVHRecordingEntry[];
    total: number;
}

interface TVHRecordingEntry {
    uuid: number;
    enabled: boolean;
    start: number;
    stop: number;
    disp_title: string;
    disp_description: string;
    disp_subtitle: string;
    channel: string;
    channel_icon: string;
    channelname: string;
    url: string;
    // and many more
}

interface TVHRecordingsConfig {
    entries: TVHRecordingConfigEntry[];
    total: number;
}

interface TVHRecordingConfigEntry {
    uuid: number;
    enabled: boolean;
    name: string;
    // and many more
}

interface DVRCallback {
    (recordings: EPGEvent[]): void;
}

interface EPGCallback {
    (channels: EPGChannel[]): void;
}

export default class TVHDataService {
    static API_SERVER_INFO = 'api/serverinfo';
    static API_EPG_TEST = 'api/epg/events/grid?dir=ASC&sort=start&limit=1&start=0';
    static API_EPG = 'api/epg/events/grid?dir=ASC&sort=start&limit=500&start=';
    static API_DVR_CONFIG = 'api/dvr/config/grid';
    static API_DVR_CREATE_BY_EVENT = 'api/dvr/entry/create_by_event?';
    static API_DVR_CANCEL = 'api/dvr/entry/cancel?uuid=';
    static API_DVR_UPCOMING = 'api/dvr/entry/grid_upcoming?duplicates=0';
    static API_DVR_RECORDINGS = 'api/dvr/entry/grid_finished?sort=disp_title';
    static M3U_PLAYLIST = 'playlist/%schannels';

    private serviceAdapter = new LunaServiceAdapter();
    //private serviceAdapter = new MockServiceAdapter();
    private maxTotalEpgEntries = 10000;
    private channels: EPGChannel[] = [];
    private url?: string;
    // private profile: string;
    private dvrUuid?: number;
    private user?: string;
    private password?: string;

    constructor(settings: TVHDataServiceParms) {
        this.url = settings.tvhUrl;
        // append trailing slash if it doesn't exist
        if (!this.url?.endsWith('/')) {
            this.url += '/';
        }
        this.dvrUuid = settings.dvrUuid;
        this.user = settings.user;
        this.password = settings.password;
    }

    /**
     * retrieve local information from tv
     */
    async getLocaleInfo() {
        const localeInfo = await this.serviceAdapter.getLocaleInfo();
        // console.log('getLocaleInfo:', localeInfo);
        return localeInfo;
    }

    /**
     * retrieve tvh server info
     */
    async retrieveServerInfo() {
        // now create rec by event
        const success = await this.serviceAdapter.call({
            url: this.url + TVHDataService.API_SERVER_INFO,
            user: this.user,
            password: this.password
        });
        return JSON.parse(success.result) as TVHServerInfo;
    }

    createRec(event: EPGEvent, callback: DVRCallback) {
        // now create rec by event
        return this.serviceAdapter
            .call({
                url:
                    this.url +
                    TVHDataService.API_DVR_CREATE_BY_EVENT +
                    'event_id=' +
                    event.getId() +
                    '&config_uuid=' +
                    this.dvrUuid +
                    '&comment=webos-tvheadend',
                user: this.user,
                password: this.password
            })
            .then(() => {
                console.log('created record: %s', event.getTitle());

                // toast information
                this.showToastMessage('Added DVR entry: ' + event.getTitle());

                // update upcoming recordings
                this.retrieveUpcomingRecordings(callback);
            })
            .catch((error) => {
                console.log('Failed to create entry by eventid: ', JSON.stringify(error));
            });
    }

    cancelRec(event: EPGEvent, callback: DVRCallback) {
        // now create rec by event
        this.serviceAdapter
            .call({
                url: this.url + TVHDataService.API_DVR_CANCEL + event.getId(),
                user: this.user,
                password: this.password
            })
            .then(() => {
                console.log('cancelled record: %s', event.getTitle());

                // toast information
                this.showToastMessage('Cancelled DVR entry: ' + event.getTitle());

                // update upcoming recordings
                this.retrieveUpcomingRecordings(callback);
            })
            .catch((error) => {
                console.log('Failed to cancel entry: ', JSON.stringify(error));
            });
    }

    retrieveUpcomingRecordings(callback: DVRCallback) {
        // now create rec by event
        this.serviceAdapter
            .call({
                url: this.url + TVHDataService.API_DVR_UPCOMING,
                user: this.user,
                password: this.password
            })
            .then((success) => {
                const response = JSON.parse(success.result) as TVHRecordings;
                console.log('retrieved upcoming records: %s', response.total);
                const recordings: EPGEvent[] = [];

                // update upcoming recordings
                response.entries.forEach((recordingEntry) => {
                    recordings.push(this.toEpgEventRec(recordingEntry));
                });
                callback(recordings);
            })
            .catch((error) => {
                console.log('Failed to retrieve recordings: ', JSON.stringify(error));
            });
    }

    async retrieveRecordings(authToken?: string): Promise<EPGChannel[]> {
        // now create rec by event
        const success = await this.serviceAdapter.call({
            url: this.url + TVHDataService.API_DVR_RECORDINGS,
            user: this.user,
            password: this.password
        });

        const response = JSON.parse(success.result) as TVHRecordings;
        console.log('retrieved recordings: %s', response.entries.length);
        const recordings: EPGChannel[] = [];

        // build recordings
        response.entries.forEach((recordingEntry) => {
            recordings.push(this.toEpgChannelRec(recordingEntry, authToken, recordings.length + 1));
        });

        return recordings;
    }

    toEpgEvent(tvhEvent: TVHEventEntry) {
        return new EPGEvent(
            tvhEvent.eventId,
            tvhEvent.start * 1000,
            tvhEvent.stop * 1000,
            tvhEvent.title,
            tvhEvent.description,
            tvhEvent.subtitle,
            tvhEvent.channelUuid
        );
    }

    toEpgEventRec(recordingEntry: TVHRecordingEntry) {
        return new EPGEvent(
            recordingEntry.uuid,
            recordingEntry.start * 1000,
            recordingEntry.stop * 1000,
            recordingEntry.disp_title,
            recordingEntry.disp_description,
            recordingEntry.disp_subtitle,
            recordingEntry.channel
        );
    }

    /**
     * build up data model from recording entry
     * One recording = one epg Channel with one epg event
     *
     * @param recordingEntry tvheadend record entry
     * @param authToken optional auth token
     * @param id number of fake channel
     */
    toEpgChannelRec(recordingEntry: TVHRecordingEntry, authToken: string | undefined, id: number): EPGChannel {
        const event = this.toEpgEventRec(recordingEntry);
        const authParam = authToken ? '?auth=' + authToken : '';
        const channel = new EPGChannel(
            recordingEntry.channel_icon && recordingEntry.channel_icon.length > 0
                ? new URL(this.url + recordingEntry.channel_icon + authParam)
                : undefined,
            recordingEntry.channelname,
            id, // use our own numbers item.channelNumber
            recordingEntry.channel,
            new URL(this.url + recordingEntry.url + authParam)
        );
        channel.addEvent(event);
        return channel;
    }

    async retrieveDVRConfig() {
        // retrieve the default dvr config
        return this.serviceAdapter
            .call({
                url: this.url + TVHDataService.API_DVR_CONFIG,
                user: this.user,
                password: this.password
            })
            .then((success) => {
                const response = JSON.parse(success.result) as TVHRecordingsConfig;
                console.log('dvr configs received: %d', response.total);

                // try first enabled
                for (let i = 0; i < response.entries.length; i++) {
                    if (response.entries[i].enabled) {
                        return response.entries[i].uuid;
                    }
                }

                // try default config -> name = ''
                for (let i = 0; i < response.entries.length; i++) {
                    if (response.entries[i].name === '') {
                        return response.entries[i].uuid;
                    }
                }

                // if no default config we use the first entry
                return response.entries[0].uuid;
            })
            .catch((error) => {
                console.log('Failed to retrieve dvr config: ', JSON.stringify(error));
                throw error;
            });
    }

    async retrieveM3UChannels(): Promise<EPGChannel[]> {
        try {
            return await this._retrieveM3UChannels((this.user || '').length > 0 && (this.password || '').length > 0);
        } catch (error) {
            return await this._retrieveM3UChannels(false);
        }
    }

    private async _retrieveM3UChannels(withAuth: boolean): Promise<EPGChannel[]> {
        try {
            // after we set the base url we retrieve channels async
            let playlistPath = null;
            // persistence token is only available for authentication on >= 4.3
            if (withAuth) {
                playlistPath = TVHDataService.M3U_PLAYLIST.replace('%s', 'auth/');
            } else {
                playlistPath = TVHDataService.M3U_PLAYLIST.replace('%s', '');
            }

            const success = await this.serviceAdapter.call({
                url: this.url + playlistPath,
                user: this.user,
                password: this.password
            });

            if (success.result) {
                const parserResult = M3UParser.parse(success.result);
                parserResult.items.forEach((item) => {
                    const channel = new EPGChannel(
                        item.logoUrl && item.logoUrl.length > 0 ? new URL(item.logoUrl) : undefined,
                        item.channelName,
                        this.channels.length + 1, // use our own numbers item.channelNumber
                        item.channelId,
                        new URL(item.streamUrl)
                    );
                    this.channels.push(channel);
                });
            }
            console.log('processed all channels %d', this.channels.length);
            return this.channels;
        } catch (error) {
            console.log('Failed to retrieve channel data: ', JSON.stringify(error));
            throw error;
        }
    }

    /** request 1 epg entry with HEAD mode */
    retrieveTVEPGTest() {
        return this.retrieveTest(this.url + TVHDataService.API_EPG_TEST, true);
    }

    /** request an url in head mode */
    retrieveTest(url: URL | string, withCredentials?: boolean) {
        return this.serviceAdapter.call({
            url: url.toString(),
            user: withCredentials ? this.user : '',
            password: withCredentials ? this.password : '',
            method: 'HEAD'
        });
    }

    retrieveTVHEPG(start: number, callback: EPGCallback) {
        let totalCount = 0;

        return this.serviceAdapter
            .call({
                url: this.url + TVHDataService.API_EPG + start,
                user: this.user,
                password: this.password
            })
            .then((success) => {
                const response = JSON.parse(success.result) as TVHEvents;
                console.log('epg events received: %d of %d', start + response.entries.length, response.totalCount);
                if (response.entries.length > 0) {
                    totalCount = response.totalCount;
                    response.entries.forEach((tvhEvent) => {
                        start++;
                        this.channels
                            .find((channel) => channel.getUUID() == tvhEvent.channelUuid)
                            ?.addEvent(this.toEpgEvent(tvhEvent));
                    });
                }

                // notify calling component
                callback(this.channels);

                // retrieve next increment
                if (start < this.maxTotalEpgEntries && totalCount > start) {
                    this.retrieveTVHEPG(start, callback);
                    return;
                }
                console.log('processed all epg events');

                try {
                    this.handleEpgCache(callback);
                } catch (err) {
                    console.log('Failure during handle epg cache processing', err);
                }
            })
            .catch((error) => {
                console.log('Failed to retrieve epg data: ', JSON.stringify(error));
            });
    }

    handleEpgCache(callback: EPGCallback) {
        // try to retrieve cached epg to display past events as well
        let cacheResult: {
            channels: EPGChannel[];
            channelEvents: ChannelEvents;
        };
        this.serviceAdapter
            .readEpgCache()
            .then((epgCacheResult) => {
                //console.log('Read epg cache was successful:', epgCacheResult.result);
                // restore cached EPG data
                cacheResult = restoreEpgDataFromCache(epgCacheResult.result, this.channels);
                // notify calling component
                callback(cacheResult.channels);
                // safe new result to disk
                this.serviceAdapter
                    .writeEpgCache(cacheResult.channelEvents)
                    .then(() => console.log('epg cache successfully updated'))
                    .catch((error) => console.log('Failed to write epg cache data:', error.errorText));
            })
            .catch((e) => {
                console.log('Failed to load Epg cache:', e.errorText);
                cacheResult = restoreEpgDataFromCache({} as ChannelEvents, this.channels);
                // notify calling component
                callback(cacheResult.channels);
                // safe new result to disk
                this.serviceAdapter
                    .writeEpgCache(cacheResult.channelEvents)
                    .then(() => console.log('epg cache successfully updated'))
                    .catch((error) => console.log('Failed to write epg cache data:', error.errorText));
            });
    }

    showToastMessage(message: string) {
        this.serviceAdapter.toast(message);
    }
}
