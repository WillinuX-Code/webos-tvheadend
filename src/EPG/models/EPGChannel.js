/**
 * Created by satadru on 3/30/17.
 */
export default class EPGChannel {

    constructor(icon, name, id, uuid) {
        this.id = id;
        this.name = name;
        this.icon = icon;
        this.uuid = uuid;
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
}