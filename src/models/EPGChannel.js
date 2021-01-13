import EPGEvent from "./EPGEvent";

/**
 * Created by satadru on 3/30/17.
 */
export default class EPGChannel {

    events: Array<EPGEvent>;
    
    /**
     * Create new instance
     * 
     * @param {URL} icon 
     * @param {string} name 
     * @param {number} id 
     * @param {string} uuid 
     * @param {URL} streamUrl 
     */
    constructor(icon, name, id, uuid, streamUrl) {
        this.id = id;
        this.name = name;
        this.icon = icon;
        this.uuid = uuid;
        this.streamUrl = streamUrl;
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