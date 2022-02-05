/**
 * Created by satadru on 3/31/17.
 */
export default class EPGUtils {
    static getWeekdayName(dateMillis: number, locale: string) {
        const date = new Date(dateMillis);
        return date.toLocaleString(locale, { weekday: 'short' });
    }

    static scaleBetween(unscaledNum: number, max: number, min = 0, minAllowed = 0, maxAllowed = 3840) {
        return ((maxAllowed - minAllowed) * (unscaledNum - min)) / (max - min) + minAllowed;
    }

    /**
     * round date to given number of minutes
     *
     * @param {Number} minutes
     * @param {Date} d
     */
    static getRoundedDate(minutes: number, d = new Date()) {
        const ms = 1000 * 60 * minutes; // convert minutes to ms
        const roundedDate = new Date(Math.round(d.getTime() / ms) * ms);
        return roundedDate;
    }
    /**
     * format time with locale formatting
     *
     * @param {Number} time
     */
    static toTimeString(time: number, locale: string) {
        const options = {
            hour: '2-digit',
            minute: '2-digit'
        } as const;
        return new Intl.DateTimeFormat(locale, options).format(new Date(time));
    }

    /**
     * format date with locale formatting
     *
     * @param {Number} time
     */
    static toDateString(time: number, locale: string) {
        const options = {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        } as const;
        return new Intl.DateTimeFormat(locale, options).format(new Date(time));
    }

    /**
     * format start - stop with locale formatting
     *
     * @param {Number} start
     * @param {Number} stop
     */
    static toTimeFrameString(start: number, stop: number, locale: string) {
        return this.toTimeString(start, locale) + ' - ' + this.toTimeString(stop, locale);
    }

    static toDuration(start: number, end: number) {
        const date = new Date(end - start);
        let result = '';
        if (date.getUTCHours() > 0) {
            result += date.getUTCHours();
            result += ':';
        }
        result += date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes();
        result += ':';
        result += date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds();
        return result;
    }

    /**
     * return current date in millis (or nanos?)
     */
    static getNow() {
        //return 1607462851000; // + 80000000;
        return Date.now();
    }
}
