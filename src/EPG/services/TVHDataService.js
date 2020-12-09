import LunaServiceAdapter from "../../luna/LunaServiceAdapter";
//import MockServiceAdapter from "../../mock/MockServiceAdapter";
import EPGChannel from "../models/EPGChannel";
import EPGEvent from "../models/EPGEvent";

export default class TVHDataService {
    constructor(callback) {
        this.serviceAdapter = new LunaServiceAdapter();
        //this.serviceAdapter = new MockServiceAdapter();
        this.maxTotalEpgEntries = 2000;
        this.baseUrl = 'http://userver.fritz.box:9981/';
        this.channels = [];
        this.channelMap = new Map();
        this.callback = callback;
    }

    /**
     * setup tvheadend config sync so other service calls 
     * or send when setup is done
     */
    setupTVHData() {
        this.serviceAdapter.call("setConfig", {
            "baseUrl": this.baseUrl
        },
            succesful => {
                console.log("setup complete: ", JSON.stringify(succesful));
                this.retrieveTVHChannels(0);
            },
            err => { console.log("setup error: ", JSON.stringify(err)) }
        );
    }

    retrieveTVHChannels(start) {
        //var service = new LunaServiceAdapter();
        // after we set the base url we retrieve channels async
        let totalCount = 0;
        this.serviceAdapter.call("getChannels", {
                "start": start
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
                        );
                        this.channelMap.set(tvhChannel.uuid, channel);
                        this.channels.push(channel);
                    });
                }
                // retrieve next increment
                if (totalCount > start) {
                    this.retrieveTVHChannels(start);
                    return;
                } 
                console.log("processed all channels");
                
                this.retrieveTVHEPG(0);
                
            },
            error => {
                console.log("Failed to retrieve channel data: ", JSON.stringify(error))
            }
        );
    }

    retrieveTVHEPG(start) {
        let totalCount = 0;

        this.serviceAdapter.call("getEpg", {
            "start": start
        },
            success => {
                console.log("epg events received: %d of %d", start + success.result.entries.length, success.result.totalCount)
                if (success.result.entries.length > 0) {
                    totalCount = success.result.totalCount;
                    success.result.entries.forEach((tvhEvent) => {
                        start++;
                        let channel = this.channelMap.get(tvhEvent.channelUuid);
                        if (channel) {
                            channel.addEvent(new EPGEvent(tvhEvent.start * 1000, tvhEvent.stop * 1000, tvhEvent.title, tvhEvent.description));
                            //this.events.push(new EPGEvent(tvhEvent.start, tvhEvent.stop, tvhEvent.title, tvhEvent.description));
                        }

                    });
                }
                // retrieve next increment
                if (start < this.maxTotalEpgEntries && totalCount > start) {
                    this.retrieveTVHEPG(start);
                    return;
                }
                console.log("processed all epg events");
                // notify calling component
                this.callback(this.channels);
            },
            error => {
                console.log("Failed to retrieve epg data: ", JSON.stringify(error))
            }
        );
    }
}