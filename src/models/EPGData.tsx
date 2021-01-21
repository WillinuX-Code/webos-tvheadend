import EPGChannel from "./EPGChannel";
import EPGEvent from "./EPGEvent";

/**
 * Created by satadru on 3/30/17.
 */
export default class EPGData {  
    private channels: EPGChannel[] = [];
    private recordings: EPGEvent[] = [];
    
    //constructor() {
        //new MockDataService().getChannels(this.channels);
        //if (this.data) {
            /*this.data.forEach((values, key) => {
                this.channels.push(key);
                values.forEach((value) => {
                    this.events.push(value);
                });
            });*/
            //this.channels = this.data;
            //this.events = Array.from(this.data.values());
        //}
    //}

    getChannels() {
        return this.channels;
    }

    getChannel(channelPosition: number): EPGChannel | null {
        let channel = this.channels[channelPosition];
        return channel || null;
    }

    getEvents(channelPosition: number) {
        let channel = this.getChannel(channelPosition);
        let events = channel?.getEvents();
        return events || [];
    }

    getEventCount(channelPosition: number) {
        return this.getEvents(channelPosition).length;
    }

    getEvent(channelPosition: number, programPosition: number) {
        let channel = this.channels[channelPosition];
        let events = channel.getEvents();
        return events[programPosition];
    }

    isRecording(epgEvent: EPGEvent) {
        return this.getRecording(epgEvent) ? true : false;
    }

    getRecording(epgEvent: EPGEvent): EPGEvent | null {
        let result:EPGEvent | null = null;
        this.recordings.forEach(recEvent => {
            if(epgEvent.isMatchingRecording(recEvent)) {
                result = recEvent;
                return;
            }
        });
        return result;
    }

    getEventPosition(channelPosition: number, event: EPGEvent) {
        let events = this.channels[channelPosition].getEvents();
        for (let i = 0; i < events.length; i++) {
            if (this.isEventSame(event, events[i])) {
                return i;
            }
        }
    }

    getChannelCount() {
        if (this.channels == null) {
            return 0;
        }
        return this.channels.length;
    }

    isEventSame(event1: EPGEvent, event2: EPGEvent) {
        if (event1.getStart() === event2.getStart() && event1.getEnd() === event2.getEnd()) {
            return true;
        }
        return false;
    }

    hasData() {
        return this.getChannelCount() > 0;
    }

    updateChannels(channels: EPGChannel[]) {
        console.log("updated epg data");
        this.channels = channels;
    }

    updateRecordings(recordings: EPGEvent[]) {
        console.log("updated recordings data");
        this.recordings = recordings;
    }
}