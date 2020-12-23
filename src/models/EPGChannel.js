/**
 * Created by satadru on 3/30/17.
 */
export default class EPGChannel {

    /**
     * Create new instance
     * 
     * @param {URL} icon 
     * @param {String} name 
     * @param {Number} id 
     * @param {String} uuid 
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

    addEvent(event) {
        this.events.push(event);
    }

    getStreamUrl() {
        return this.streamUrl;
    }
}