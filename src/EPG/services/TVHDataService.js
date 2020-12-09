import LunaServiceAdapter from "../../luna/LunaServiceAdapter";
//import MockServiceAdapter from "../../mock/MockServiceAdapter";
import EPGChannel from "../models/EPGChannel";
import EPGEvent from "../models/EPGEvent";

export default class TVHDataService {
    static API_INITIAL_CHANNELS = "api/channel/grid?dir=ASC&sort=number&start=";
    static API_EPG = "api/epg/events/grid?dir=ASC&sort=start&limit=500&start=";

    constructor(callback) {
        this.serviceAdapter = new LunaServiceAdapter();
        //this.serviceAdapter = new MockServiceAdapter();
        this.maxTotalEpgEntries = 10000;
        this.baseUrl = 'http://userver.fritz.box:9981/';
        this.channels = [];
        this.channelMap = new Map();
        this.callback = callback;
    }

    retrieveTVHChannels(start) {
        //var service = new LunaServiceAdapter();
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
                            tvhChannel.uuid
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
                            channel.addEvent(new EPGEvent(
                                tvhEvent.start * 1000, tvhEvent.stop * 1000, tvhEvent.title, tvhEvent.description, tvhEvent.subtitle));
                            //this.events.push(new EPGEvent(tvhEvent.start, tvhEvent.stop, tvhEvent.title, tvhEvent.description));
                        }

                    });
                }
                // notify calling component
                this.callback(this.channels);
                // retrieve next increment
                if (start < this.maxTotalEpgEntries && totalCount > start) {
                    this.retrieveTVHEPG(start);
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