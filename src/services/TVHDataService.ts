import LunaServiceAdapter from '../luna/LunaServiceAdapter';
//import MockServiceAdapter from '../mock/MockServiceAdapter';
import EPGChannel from '../models/EPGChannel';
import EPGEvent from '../models/EPGEvent';
import M3UParser from '../utils/M3UParser';

export interface TVHSettingsOptions {
    tvhUrl: string;
    user?: string;
    password?: string;
    connectionStatus: string;
    // selectedProfile: string;
    // profiles: Array<any>;
    // tvChannelTagUuid: string;
    dvrConfigUuid: string;
    connectButtonEnabled: boolean;
    isValid: boolean;
    isUserValid: boolean;
    isLoading: boolean;
}

interface TVHServerInfo {
    sw_version: string;
    api_version: number;
    name: string;
    capabilities: string[];
}

interface TVHProfiles {
    entries: TVHProfileEntry[];
}

interface TVHProfileEntry {
    key: string;
    val: string;
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
    entries: TVHRecordingEntry[],
    total: number
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
    static API_PROFILE_LIST = 'api/profile/list';
    // static API_CHANNEL_TAGS = 'api/channeltag/list';
    // static API_INITIAL_CHANNELS = 'api/channel/grid?dir=ASC&sort=number&start=';
    static API_EPG = 'api/epg/events/grid?dir=ASC&sort=start&limit=500&start=';
    static API_DVR_CONFIG = 'api/dvr/config/grid';
    static API_DVR_CREATE_BY_EVENT = 'api/dvr/entry/create_by_event?';
    static API_DVR_CANCEL = 'api/dvr/entry/cancel?uuid=';
    static API_DVR_UPCOMING = 'api/dvr/entry/grid_upcoming?duplicates=0';
    static M3U_PLAYLIST = 'playlist/%schannels';

    private serviceAdapter = new LunaServiceAdapter();
    //private serviceAdapter = new MockServiceAdapter();
    private maxTotalEpgEntries = 10000;
    private channels: EPGChannel[] = [];
    private channelMap = new Map();
    private url: string;
    // private profile: string;
    private dvrUuid: string;
    private user?: string;
    private password?: string;

    constructor(settings: TVHSettingsOptions) {
        this.url = settings.tvhUrl;
        // append trailing slash if it doesn't exist
        if (!this.url.endsWith('/')) {
            this.url += '/';
        }
        // this.profile = settings.selectedProfile;
        this.dvrUuid = settings.dvrConfigUuid;
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

    /**
     * retrieve the stream profile list
     */
    async retrieveProfileList() {
        const success = await this.serviceAdapter.call({
            url: this.url + TVHDataService.API_PROFILE_LIST,
            user: this.user,
            password: this.password
        });
        return JSON.parse(success.result) as TVHProfiles;
    }

    createRec(event: EPGEvent, callback: DVRCallback) {
        // now create rec by event
        this.serviceAdapter
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
                response.entries.forEach((recordingEntry: TVHRecordingEntry) => {
                    recordings.push(this.toEpgEventRec(recordingEntry));
                });
                callback(recordings);
            })
            .catch((error) => {
                console.log('Failed to retrieve recordings: ', JSON.stringify(error));
            });
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
     * return the channel tag reference for "TV Channels"
     */
    // async retrieveTvChannelTag() {
    //     // retrieve the default dvr config
    //     let success = await this.serviceAdapter.call({
    //         'url': this.url + TVHDataService.API_CHANNEL_TAGS,
    //         'user': this.user,
    //         'password': this.password
    //     });
    //     let response = JSON.parse(success.result);
    //     // return tv channels tag
    //     for (var i = 0; i < response.entries.length; i++) {
    //         if (response.entries[i].val === 'TV channels') {
    //             console.log('TV Channel Tag:', response.entries[i].key);
    //             return response.entries[i].key;
    //         }
    //     };
    // }

    async retrieveDVRConfig() {
        // retrieve the default dvr config
        this.serviceAdapter
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
            });
    }

    // async retrieveTVHChannels(start: number) {
    //     // after we set the base url we retrieve channels async
    //     let totalCount = 0;
    //     try {
    //         let success = await this.serviceAdapter.call({
    //             'url': this.url + TVHDataService.API_INITIAL_CHANNELS + start,
    //             'user': this.user,
    //             'password': this.password
    //         });
    //         let response = JSON.parse(success.result);
    //         console.log('channels received: %d of %d', start + response.entries.length, response.total)
    //         if (response.entries.length > 0) {
    //             totalCount = response.total;
    //             success.result.entries.forEach((tvhChannel: any) => {
    //                 start++;
    //                 // check if channel contains is a tvchannel
    //                 // if (!tvhChannel.tags.includes(this.tvChannelUuid)) {
    //                 //     return;
    //                 // }
    //                 let channel = new EPGChannel(
    //                     // complete icon url
    //                     new URL(this.url + tvhChannel.icon_public_url),
    //                     tvhChannel.name,
    //                     this.channels.length + 1,   // use our own numbers tvhChannel.number,
    //                     tvhChannel.uuid,
    //                     new URL(this.url + 'stream/channel/' + tvhChannel.uuid + (this.profile ? '?profile=' + this.profile : ''))
    //                 );
    //                 this.channelMap.set(tvhChannel.uuid, channel);
    //                 this.channels.push(channel);
    //             });
    //         }
    //         // retrieve next increment
    //         if (totalCount > start) {
    //             await this.retrieveTVHChannels(start);
    //             return this.channels;
    //         }
    //         console.log('processed all channels %d', this.channels.length);
    //         return this.channels;
    //     } catch (error) {
    //         console.log('Failed to retrieve channel data: ', JSON.stringify(error))
    //         return [];
    //     };
    // }

    async retrieveM3UChannels() {
        // after we set the base url we retrieve channels async
        let playlistPath = null;
        if ((this.user || '').length > 0 && (this.password || '').length > 0) {
            playlistPath = TVHDataService.M3U_PLAYLIST.replace('%s', 'auth/');
        } else {
            playlistPath = TVHDataService.M3U_PLAYLIST.replace('%s', '');
        }

        try {
            const success = await this.serviceAdapter.call({
                url: this.url + playlistPath,
                user: this.user,
                password: this.password
            });

            if (success.result) {
                const parser = new M3UParser(success.result);
                const parserResult = parser.parse();
                parserResult.items.forEach((item) => {
                    const channel = new EPGChannel(
                        new URL(item.logoUrl),
                        item.channelName,
                        this.channels.length + 1, // use our own numbers item.channelNumber
                        item.channelId,
                        new URL(item.streamUrl)
                    );
                    this.channelMap.set(channel.getUUID(), channel);
                    this.channels.push(channel);
                });
            }
            console.log('processed all channels %d', this.channels.length);
            return this.channels;
        } catch (error) {
            console.log('Failed to retrieve channel data: ', JSON.stringify(error));
            return [];
        }
    }

    retrieveTVHEPG(start: number, callback: EPGCallback) {
        let totalCount = 0;

        this.serviceAdapter
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
                        const channel = this.channelMap.get(tvhEvent.channelUuid);
                        if (channel) {
                            channel.addEvent(this.toEpgEvent(tvhEvent));
                        }
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
            })
            .catch((error) => {
                console.log('Failed to retrieve epg data: ', JSON.stringify(error));
            });
    }

    showToastMessage(message: string) {
        this.serviceAdapter.toast(message);
    }
}
