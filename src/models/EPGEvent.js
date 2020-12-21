import EPGUtils from "../utils/EPGUtils";

/**
 * Created by satadru on 3/30/17.
 */
export default class EPGEvent {

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

    isMatchingRecording(epgEvent) {
        return epgEvent.getStart() === this.getStart() && epgEvent.getEnd() === this.getEnd() && epgEvent.getChannelUuid() === this.getChannelUuid();
    }

    isPastDated(now) {
        return now >= this.getEnd();
    }
}