import EPGUtils from '../utils/EPGUtils';

/**
 * Created by satadru on 3/30/17.
 */
export default class EPGEvent {
    constructor(
        private id: number,
        private start: number,
        private end: number,
        private title: string,
        private description: string,
        private subTitle: string,
        private channelUuid: string
    ) { }

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

    getDuration() {
        return this.end - this.start;
    }

    getDoneFactor() {
        const now = EPGUtils.getNow();
        if (now > this.end) {
            return 1;
        } else if (now < this.start) {
            return 0;
        } else {
            return (now - this.start) / this.getDuration();
        }
    }

    isCurrent() {
        const now = EPGUtils.getNow();
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
        return (
            epgEvent.getStart() === this.getStart() &&
            epgEvent.getEnd() === this.getEnd() &&
            epgEvent.getChannelUuid() === this.getChannelUuid()
        );
    }

    isPastDated(now: number) {
        return now >= this.getEnd();
    }
}
