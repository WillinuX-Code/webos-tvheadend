import EPGUtils from '../utils/EPGUtils';

/**
 * Created by satadru on 3/30/17.
 */
export default class EPGEvent {
    private epgUtils: EPGUtils;

    constructor(
        private id: number,
        private start: number,
        private end: number,
        private title: string,
        private description: string,
        private subTitle: string,
        private channelUuid: string
    ) {
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
        const now = this.epgUtils.getNow();
        if (now > this.end) {
            return 1;
        } else if (now < this.start) {
            return 0;
        } else {
            const duration = this.end - this.start;
            return (now - this.start) / duration;
        }
    }

    isCurrent() {
        const now = this.epgUtils.getNow();
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
