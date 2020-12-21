import LunaServiceAdapter from "../luna/LunaServiceAdapter";
//import MockServiceAdapter from "../../mock/MockServiceAdapter";
import EPGChannel from "../models/EPGChannel";
import EPGEvent from "../models/EPGEvent";

export default class TVHDataService {
    static API_INITIAL_CHANNELS = "api/channel/grid?dir=ASC&sort=number&start=";
    static API_EPG = "api/epg/events/grid?dir=ASC&sort=start&limit=500&start=";
    static API_DVR_CONFIG = "api/dvr/config/grid";
    static API_DVR_CREATE_BY_EVENT = "api/dvr/entry/create_by_event?";
    static API_DVR_CANCEL = "api/dvr/entry/cancel?uuid=";
    static API_DVR_UPCOMING = "api/dvr/entry/grid_upcoming?duplicates=0";

    constructor() {
        this.serviceAdapter = new LunaServiceAdapter();
        //this.serviceAdapter = new MockServiceAdapter();
        this.maxTotalEpgEntries = 10000;
        this.baseUrl = 'http://userver.fritz.box:9981/';
        this.channels = [];
        this.channelMap = new Map();
        this.dvrUuid = "";
        // retrieve the default dvr config
        this.retrieveDVRConfig(dvrUuid => {
            this.dvrUuid = dvrUuid;
        });
    }

    createRec(event, callback) {
        // now create rec by event
        this.serviceAdapter.call("proxy", {
            "url": this.baseUrl + TVHDataService.API_DVR_CREATE_BY_EVENT + "event_id=" + event.getId() + "&config_uuid=" + this.dvrUuid + "&comment=webos-tvheadend"
        },
        success => {
            console.log("created record: %s", success.result.total)
            // toast information
            this.serviceAdapter.toast("Added DVR entry: " + event.getTitle())
            // update upcoming recordings
            this.retrieveUpcomingRecordings(callback);
        },
        error => {
            console.log("Failed to create entry by eventid: ", JSON.stringify(error))
        });
    }

    cancelRec(event, callback) {
        // now create rec by event
        this.serviceAdapter.call("proxy", {
            "url": this.baseUrl + TVHDataService.API_DVR_CANCEL + event.getId()
        },
        success => {
            console.log("created record: %s", success.result.total)
            // toast information
            this.serviceAdapter.toast("Cancelled DVR entry: " + event.getTitle())
            // update upcoming recordings
            this.retrieveUpcomingRecordings(callback);
        },
        error => {
            console.log("Failed to cancel entry: ", JSON.stringify(error))
        });
    }

    async retrieveUpcomingRecordings(callback) {
        // now create rec by event
        this.serviceAdapter.call("proxy", {
            "url": this.baseUrl + TVHDataService.API_DVR_UPCOMING
        },
        success => {
            console.log("retrieved upcoming records: %s", success.result.total)
            let recordings = [];
            // update upcoming recordings
            success.result.entries.forEach(tvhEvent => {
                recordings.push(this.toEpgEventRec(tvhEvent));
            });
            callback(recordings);
        },
        error => {
            console.log("Failed to retrieve recordings: ", JSON.stringify(error))
        });
    }

    toEpgEvent(tvhEvent) {
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

    toEpgEventRec(recordEntry) {
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

    retrieveDVRConfig(callback) {
        // retrieve the default dvr config
        this.serviceAdapter.call("proxy", {
            "url": this.baseUrl + TVHDataService.API_DVR_CONFIG
            },
            success => {
                console.log("dvr configs received: %d", success.result.total)
                // get default config -> name = ""
                if (success.result.entries.length > 0) {
                    let dvrConfigUuid = "";
                    success.result.entries.forEach((entry) => {
                        if(entry.name === "") {
                            dvrConfigUuid = entry.uuid;
                            return;
                        }
                    });
                    // if no default config we use the first entry
                    if(dvrConfigUuid === "") {
                        dvrConfigUuid = success.result.entries[0].uuid;
                    }
                    callback(dvrConfigUuid);
                }            
            },
            error => {
                console.log("Failed to retrieve dvr config: ", JSON.stringify(error))
            }
        );
    }

    retrieveTVHChannels(start, callback) {
        // after we set the base url we retrieve channels async
        let totalCount = 0;
        this.serviceAdapter.call("proxy", {
                "url": this.baseUrl + TVHDataService.API_INITIAL_CHANNELS + start
            },
            success => {
                console.log("channels received: %d of %d", start + success.result.entries.length, success.result.total)
                if (success.result.entries.length > 0) {
                    totalCount = success.result.total;
                    success.result.entries.forEach((tvhChannel) => {
                        start++;
                        // TODO workaround - ignore radio for now
                        if (tvhChannel.number <= 0) {
                            return;
                        }
                        let channel = new EPGChannel(
                            // complete icon url
                            this.baseUrl + tvhChannel.icon_public_url,
                            tvhChannel.name,
                            tvhChannel.number,
                            tvhChannel.uuid,
                            this.baseUrl + "stream/channel/"+tvhChannel.uuid+"?profile=pass"
                        );
                        this.channelMap.set(tvhChannel.uuid, channel);
                        this.channels.push(channel);
                    });
                }
                // retrieve next increment
                if (totalCount > start) {
                    this.retrieveTVHChannels(start, callback);
                    return;
                } 

                callback(this.channels);
                console.log("processed all channels %d", this.channels.length);
            },
            error => {
                console.log("Failed to retrieve channel data: ", JSON.stringify(error))
            }
        );
    }

    async retrieveTVHEPG(start, callback) {
        let totalCount = 0;

        this.serviceAdapter.call("proxy", {
            "url": this.baseUrl + TVHDataService.API_EPG + start
        },
            success => {
                console.log("epg events received: %d of %d", start + success.result.entries.length, success.result.totalCount)
                if (success.result.entries.length > 0) {
                    totalCount = success.result.totalCount;
                    success.result.entries.forEach((tvhEvent) => {
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
                console.log("processed all epg events");
                
            },
            error => {
                console.log("Failed to retrieve epg data: ", JSON.stringify(error))
            }
        );
    }
}