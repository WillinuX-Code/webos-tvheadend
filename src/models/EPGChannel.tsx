import EPGEvent from "./EPGEvent";

/**
 * Created by satadru on 3/30/17.
 */
export default class EPGChannel {

    private events: EPGEvent[];

    constructor(private icon: URL, private name: string, private id: number, private uuid: string, private streamUrl: URL) {
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

    addEvent(event: EPGEvent) {
        this.events.push(event);
    }

    getStreamUrl() {
        return this.streamUrl;
    }
}