import EPGUtils from "../utils/EPGUtils";

/**
 * Created by satadru on 3/30/17.
 */
export default class EPGEvent {

    /**
     * create new Instance
     * 
     * @param {number} id 
     * @param {number} start 
     * @param {number} end 
     * @param {string} title 
     * @param {string} description 
     * @param {string} subTitle 
     * @param {string} channelUuid 
     */
    constructor(id, start, end, title, description, subTitle, channelUuid) {
        this.id = id;
        this.title = title;
        this.start = start;
        this.end = end;
        this.description = description;
        this.subTitle = subTitle;
        this.channelUuid = channelUuid;

        this.epgUtils = new EPGUtils();
    }

    getId() {
        return this.id;
    }

    getTitle() {
        return this.title;
    }

    getStart() {
        return this.start;
    }

    getEnd() {
        return this.end;
    }

    getDoneFactor() {
        let now = this.epgUtils.getNow();
        if (now > this.end) {
            return 1;
        } else if (now < this.start) {
            return 0;
        } else {
            let duration = this.end - this.start;
            return (now - this.start) / duration;
        }
    }

    isCurrent() {
        let now = this.epgUtils.getNow();
        return now >= this.start && now <= this.end;
    }

    getDescription() {
        return this.description;
    }

    getSubTitle() {
        return this.subTitle;
    }

    getChannelUuid() {
        return this.channelUuid;
    }

    isMatchingRecording(epgEvent: EPGEvent) {
        return epgEvent.getStart() === this.getStart() && epgEvent.getEnd() === this.getEnd() && epgEvent.getChannelUuid() === this.getChannelUuid();
    }

    isPastDated(now: number) {
        return now >= this.getEnd();
    }
}