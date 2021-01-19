import LunaServiceAdapter from '../luna/LunaServiceAdapter';
//import MockServiceAdapter from '../mock/MockServiceAdapter';
import EPGChannel from '../models/EPGChannel';
import EPGEvent from '../models/EPGEvent';

export interface TVHSettingsOptions {
    tvhUrl: string;
    user?: string;
    password?: string;
    connectionStatus: string;
    selectedProfile: string;
    profiles: Array<any>;
    tvChannelTagUuid: string;
    dvrConfigUuid: string;
    connectButtonEnabled: boolean;
    isValid: boolean;
    isUserValid: boolean;
    isLoading: boolean;
}

interface TVHEvent {
    eventId: number;
    start: number;
    stop: number;
    title: string;
    description: string;
    subtitle: string;
    channelUuid: string;
}

interface RecordEntry {
    uuid: number;
    start: number;
    stop: number;
    disp_title: string;
    disp_description: string;
    disp_subtitle: string;
    channel: string;
}

interface RecordingCallback {
    (recordings: EPGEvent[]): void;
}

interface EPGCallback {
    (channels: EPGChannel[]): void;
}

export default class TVHDataService {
    static API_SERVER_INFO = 'api/serverinfo';
    static API_PROFILE_LIST = 'api/profile/list';
    static API_CHANNEL_TAGS = 'api/channeltag/list';
    static API_INITIAL_CHANNELS = 'api/channel/grid?dir=ASC&sort=number&start=';
    static API_EPG = 'api/epg/events/grid?dir=ASC&sort=start&limit=500&start=';
    static API_DVR_CONFIG = 'api/dvr/config/grid';
    static API_DVR_CREATE_BY_EVENT = 'api/dvr/entry/create_by_event?';
    static API_DVR_CANCEL = 'api/dvr/entry/cancel?uuid=';
    static API_DVR_UPCOMING = 'api/dvr/entry/grid_upcoming?duplicates=0';

    private serviceAdapter = new LunaServiceAdapter(); 
    //private serviceAdapter = new MockServiceAdapter();
    private maxTotalEpgEntries = 10000;
    private channels: EPGChannel[] = [];
    private channelMap = new Map();
    private url: string;
    private profile: string;
    private dvrUuid: string;
    private user?: string;
    private password?: string;

    constructor(settings: TVHSettingsOptions) {
        this.url = settings.tvhUrl;
        // append trailing slash if it doesn't exist
        if (!this.url.endsWith('/')) {
            this.url += '/';
        }
        this.profile = settings.selectedProfile;
        this.dvrUuid = settings.dvrConfigUuid;
        this.user = settings.user;
        this.password = settings.password;
    }

    /**
     * retrieve local information from tv
     */
    async getLocaleInfo() {
        let localeInfo = await this.serviceAdapter.getLocaleInfo();
        // console.log('getLocaleInfo:', localeInfo);
        return localeInfo;
    }

    /**
     * retrieve tvh server info
     */
    async retrieveServerInfo() {
        // now create rec by event
        return this.serviceAdapter.call('proxy', {
            'url': this.url + TVHDataService.API_SERVER_INFO,
            'user': this.user,
            'password': this.password
        });
    }

    /**
     * retrieve the stream profile list
     */
    async retrieveProfileList() {
        return this.serviceAdapter.call('proxy', {
            'url': this.url + TVHDataService.API_PROFILE_LIST,
            'user': this.user,
            'password': this.password
        });
    }

    createRec(event: EPGEvent, callback: RecordingCallback) {
        // now create rec by event
        this.serviceAdapter.call('proxy', {
            'url': this.url + TVHDataService.API_DVR_CREATE_BY_EVENT + 'event_id=' + event.getId() + '&config_uuid=' + this.dvrUuid + '&comment=webos-tvheadend',
            'user': this.user,
            'password': this.password
        }).then(success => {
            console.log('created record: %s', success.result.total)
            // toast information
            this.showToastMessage('Added DVR entry: ' + event.getTitle())
            // update upcoming recordings
            this.retrieveUpcomingRecordings(callback);
        }).catch(error => {
            console.log('Failed to create entry by eventid: ', JSON.stringify(error))
        });
    }

    cancelRec(event: EPGEvent, callback: RecordingCallback) {
        // now create rec by event
        this.serviceAdapter.call('proxy', {
            'url': this.url + TVHDataService.API_DVR_CANCEL + event.getId(),
            'user': this.user,
            'password': this.password
        }).then(success => {
            console.log('created record: %s', success.result.total)
            // toast information
            this.showToastMessage('Cancelled DVR entry: ' + event.getTitle())
            // update upcoming recordings
            this.retrieveUpcomingRecordings(callback);
        }).catch(error => {
            console.log('Failed to cancel entry: ', JSON.stringify(error))
        });
    }

    retrieveUpcomingRecordings(callback: RecordingCallback) {
        // now create rec by event
        this.serviceAdapter.call('proxy', {
            'url': this.url + TVHDataService.API_DVR_UPCOMING,
            'user': this.user,
            'password': this.password
        }).then(success => {
            console.log('retrieved upcoming records: %s', success.result.total)
            let recordings: EPGEvent[] = [];
            // update upcoming recordings
            success.result.entries.forEach((tvhEvent: any) => {
                recordings.push(this.toEpgEventRec(tvhEvent));
            });
            callback(recordings);
        }).catch(error => {
            console.log('Failed to retrieve recordings: ', JSON.stringify(error))
        });
    }

    toEpgEvent(tvhEvent: TVHEvent) {
        return new EPGEvent(
            tvhEvent.eventId,
            tvhEvent.start * 1000,
            tvhEvent.stop * 1000,
            tvhEvent.title,
            tvhEvent.description,
            tvhEvent.subtitle,
            tvhEvent.channelUuid
        )
    }

    toEpgEventRec(recordEntry: RecordEntry) {
        return new EPGEvent(
            recordEntry.uuid,
            recordEntry.start * 1000,
            recordEntry.stop * 1000,
            recordEntry.disp_title,
            recordEntry.disp_description,
            recordEntry.disp_subtitle,
            recordEntry.channel
        )
    }

    /**
     * return the channel tag reference for "TV Channels"
     */
    async retrieveTvChannelTag() {
        // retrieve the default dvr config
        let response = await this.serviceAdapter.call('proxy', {
            'url': this.url + TVHDataService.API_CHANNEL_TAGS,
            'user': this.user,
            'password': this.password
        });
        // return tv channels tag
        for (var i = 0; i < response.result.entries.length; i++) {
            if (response.result.entries[i].val === 'TV channels') {
                console.log('TV Channel Tag:', response.result.entries[i].key);
                return response.result.entries[i].key;
            }
        };
    }

    async retrieveDVRConfig() {
        // retrieve the default dvr config
        this.serviceAdapter.call('proxy', {
            'url': this.url + TVHDataService.API_DVR_CONFIG,
            'user': this.user,
            'password': this.password
        }).then((success) => {
            console.log('dvr configs received: %d', success.result.total)
            // try first enabled
            for (var i = 0; i < success.result.entries.length; i++) {
                if (success.result.entries[i].enabled) {
                    return success.result.entries[i].uuid;
                }
            }
            // try default config -> name = ''
            for (i = 0; i < success.result.entries.length; i++) {
                if (success.result.entries[i].name === '') {
                    return success.result.entries[i].uuid;
                }
            }
            // if no default config we use the first entry
            return success.result.entries[0].uuid;
        }).catch(error => {
            console.log('Failed to retrieve dvr config: ', JSON.stringify(error))
        });
    }

    async retrieveTVHChannels(start: number) {
        // after we set the base url we retrieve channels async
        let totalCount = 0;
        try {
            let success = await this.serviceAdapter.call('proxy', {
                'url': this.url + TVHDataService.API_INITIAL_CHANNELS + start,
                'user': this.user,
                'password': this.password
            });
            console.log('channels received: %d of %d', start + success.result.entries.length, success.result.total)
            if (success.result.entries.length > 0) {
                totalCount = success.result.total;
                success.result.entries.forEach((tvhChannel: any) => {
                    start++;
                    // check if channel contains is a tvchannel
                    // if (!tvhChannel.tags.includes(this.tvChannelUuid)) {
                    //     return;
                    // }
                    let channel = new EPGChannel(
                        // complete icon url
                        new URL(this.url + tvhChannel.icon_public_url),
                        tvhChannel.name,
                        this.channels.length + 1,   // use our own numbers tvhChannel.number,
                        tvhChannel.uuid,
                        new URL(this.url + 'stream/channel/' + tvhChannel.uuid + (this.profile ? '?profile=' + this.profile : ''))
                    );
                    this.channelMap.set(tvhChannel.uuid, channel);
                    this.channels.push(channel);
                });
            }
            // retrieve next increment
            if (totalCount > start) {
                await this.retrieveTVHChannels(start);
                return this.channels;
            }
            console.log('processed all channels %d', this.channels.length);
            return this.channels;
        } catch (error) {
            console.log('Failed to retrieve channel data: ', JSON.stringify(error))
            return [];
        };
    }

    retrieveTVHEPG(start: number, callback: EPGCallback) {
        let totalCount = 0;

        this.serviceAdapter.call('proxy', {
            'url': this.url + TVHDataService.API_EPG + start,
            'user': this.user,
            'password': this.password
        }).then(success => {
            console.log('epg events received: %d of %d', start + success.result.entries.length, success.result.totalCount)
            if (success.result.entries.length > 0) {
                totalCount = success.result.totalCount;
                success.result.entries.forEach((tvhEvent: any) => {
                    start++;
                    let channel = this.channelMap.get(tvhEvent.channelUuid);
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

        }).catch(error => {
            console.log('Failed to retrieve epg data: ', JSON.stringify(error))
        });
    }

    showToastMessage(message: string) {
        this.serviceAdapter.toast(message);
    }
}