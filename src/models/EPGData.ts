import EPGChannel from './EPGChannel';
import EPGEvent from './EPGEvent';

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

    getChannels(): EPGChannel[] {
        return this.channels;
    }

    getChannel(channelPosition: number): EPGChannel | null {
        const channel = this.channels[channelPosition];
        return channel || null;
    }

    getEvents(channelPosition: number): EPGEvent[] {
        const channel = this.getChannel(channelPosition);
        const events = channel?.getEvents();
        return events || [];
    }

    getEventCount(channelPosition: number): number {
        return this.getEvents(channelPosition).length;
    }

    getEvent(channelPosition: number, eventPosition: number) {
        const channel = this.channels[channelPosition];
        const events = channel.getEvents();
        return events[eventPosition];
    }

    getEventBeforeTimestamp(channelPosition: number, timestamp: number) {
        const channel = this.channels[channelPosition];
        const events = channel.getEvents();

        // find the first event before the timestamp
        return events
            .filter((event) => event.getEnd() <= timestamp)
            .reduce((prev, current) => (prev.getEnd() > current.getEnd() ? prev : current));
    }

    getEventAtTimestamp(channelPosition: number, timestamp: number) {
        const channel = this.channels[channelPosition];
        const events = channel.getEvents();

        // find the event at the timestamp
        return events.find((event) => event.getStart() <= timestamp && timestamp <= event.getEnd());
    }

    getEventAfterTimestamp(channelPosition: number, timestamp: number) {
        const channel = this.channels[channelPosition];
        const events = channel.getEvents();

        // find the first event after the timestamp
        return events
            .filter((event) => event.getStart() >= timestamp)
            .reduce((prev, current) => (prev.getStart() < current.getStart() ? prev : current));
    }

    isRecording(epgEvent: EPGEvent) {
        return !!this.getRecording(epgEvent);
    }

    getRecording(epgEvent: EPGEvent) {
        return this.recordings.find((recEvent) => epgEvent.isMatchingRecording(recEvent));
    }

    getEventPosition(channelPosition: number, eventToFind: EPGEvent) {
        return this.channels[channelPosition].getEvents().findIndex((event) => this.isEventSame(event, eventToFind));
    }

    getChannelCount(): number {
        if (this.channels == null) {
            return 0;
        }
        return this.channels.length;
    }

    isEventSame(event1: EPGEvent, event2: EPGEvent): boolean {
        return event1.getId() === event2.getId();
    }

    hasData(): boolean {
        return this.getChannelCount() > 0;
    }

    updateChannels(channels: EPGChannel[]): void {
        this.channels = channels;
    }

    updateStreamUrl(channels: EPGChannel[]): void {
        for (let i = 0; i < channels.length; i++) {
            for (let k = 0; k < this.channels.length; k++) {
                if (channels[i].getUUID() == this.channels[k].getUUID()) {
                    this.channels[k].setStreamUrl(channels[i].getStreamUrl());
                    break;
                }
            }
        }
    }

    updateRecordings(recordings: EPGEvent[]): void {
        this.recordings = recordings;
    }
}
