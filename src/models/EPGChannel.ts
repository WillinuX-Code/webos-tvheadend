import EPGEvent from './EPGEvent';

/**
 * Created by satadru on 3/30/17.
 */
export default class EPGChannel {
    private events: EPGEvent[];

    constructor(
        protected icon: URL | undefined,
        protected name: string,
        protected id: number,
        protected uuid: string,
        protected streamUrl: URL
    ) {
        this.events = [];
    }

    getChannelID() {
        return this.id;
    }

    getName() {
        return this.name;
    }

    getUUID() {
        return this.uuid;
    }

    getImageURL() {
        return this.icon;
    }

    getEvents() {
        return this.events;
    }

    setEvents(events: EPGEvent[]) {
        this.events = events;
    }

    addEvent(event: EPGEvent) {
        this.events.push(event);
    }

    getStreamUrl() {
        return this.streamUrl;
    }

    setStreamUrl(streamUrl: URL) {
        this.streamUrl = streamUrl;
    }
}
