/**
 * Created by satadru on 3/31/17.
 */
export default class EPGUtils {

    private locale: string;

    constructor(locale?: string) {
        this.locale = locale || 'en-US';
    }

    getWeekdayName(dateMillis: number) {
        var userLang = navigator.language;
        userLang = userLang.substring(0, 2);
        let dayMap = new Map();
        dayMap.set('de', ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag']);
        dayMap.set('en', ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']);
        //let days = ['Sun','Mon','Tues','Wed','Thus','Fri','Sat'];
        // TODO setting language - depend on country germany or english
        let days = dayMap.get(userLang);
        if (days === undefined) {
            days = dayMap.get('en');
        }
        let date = new Date(dateMillis);
        return days[date.getDay()];
    }

    scaleBetween(unscaledNum: number, max: number, min = 0, minAllowed = 0, maxAllowed = 3840) {
        return ((maxAllowed - minAllowed) * (unscaledNum - min) / (max - min) + minAllowed);
    }

    /**
     * round date to given number of minutes
     * 
     * @param {Number} minutes 
     * @param {Date} d
     */
    getRoundedDate(minutes: number, d = new Date()) {
        let ms = 1000 * 60 * minutes; // convert minutes to ms
        let roundedDate = new Date(Math.round(d.getTime() / ms) * ms);
        return roundedDate
    }
    /**
     * format time with locale formatting
     * 
     * @param {Number} time 
     */
    toTimeString(time: number) {
        let options = {
            hour: '2-digit',
            minute: '2-digit'
        }
        return new Intl.DateTimeFormat(this.locale, options).format(new Date(time));
    }

    /**
     * format start - stop with locale formatting
     * 
     * @param {Number} start 
     * @param {Number} stop 
     */
    toTimeFrameString(start: number, stop: number) {
        return this.toTimeString(start) + " - " + this.toTimeString(stop);
    }

    toDuration(start: number, end: number) {
        let date = new Date(end - start);
        var result = "";
        if (date.getUTCHours() > 0) {
            result += date.getUTCHours();
            result += ":"
        }
        result += date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes();
        result += ":";
        result += date.getSeconds() < 10 ? "0" + date.getSeconds() : date.getSeconds()
        return result;
    }

    /**
     * return current date in millis (or nanos?)
     */
    getNow() {
        return 1610642031232; // TODO: why is Date.now() returning a date in the past?!
        // 1610577755018
        //return Date.now(); // 1610577755018
        //return Date.now();
    }
}