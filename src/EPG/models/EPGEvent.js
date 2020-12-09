/**
 * Created by satadru on 3/30/17.
 */
export default class EPGEvent {

    constructor(start, end, title, description, subTitle) {
        this.title = title;
        this.start = start;
        this.end = end;
        this.description = description;
        this.subTitle = subTitle;
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
        let now = Date.now();
        return now >= this.start && now <= this.end;
    }

    getDescription() {
        return this.description;
    }

    getSubTitle() {
        return this.subTitle;
    }
}