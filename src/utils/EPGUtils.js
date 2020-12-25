/**
 * Created by satadru on 3/31/17.
 */
export default class EPGUtils {

    constructor(locale) {
        this.locale = locale;
    }
    getShortTime(timeMillis) {
        var now = new Date(timeMillis);
        var hour = now.getHours();
        var minutes = now.getMinutes();
        //return dateWithouthSecond.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        //var minutes = now.getMinutes();

        //var ampm = "AM";
        if (minutes < 15) {
            minutes = "00";
        } else if (minutes < 45) {
            minutes = "30";
        } else {
            minutes = "00";
            ++hour;
        }

        /* TODO setting time format*/
        if (hour > 23) {
            hour = 0;
        }/*
        if (hour > 23) {
            hour = 12;
        } /*else if (hour > 12) {
            hour = hour - 12;
            ampm = "PM";
        } else if (hour === 12) {
            ampm = "PM";
        } else if (hour === 0) {
            hour = 12;
        }*/

        //return(hour + ":" + minutes + " " + ampm);
        return (hour + ":" + minutes);
        //return dateWithouthSecond.getHours() + ":" + dateWithouthSecond.getMinutes();
    }

    getWeekdayName(dateMillis) {
        var userLang = navigator.language || navigator.userLanguage;
        userLang = userLang.substring(0, 2);
        let dayMap = new Map();
        dayMap.set('de', ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag']);
        dayMap.set('en', ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']);
        //let days = ['Sun','Mon','Tues','Wed','Thus','Fri','Sat'];
        // TODO setting languagee - depend on country germany or englisch
        let days = dayMap.get(userLang);
        if (days === undefined) {
            days = dayMap.get('en');
        }
        let date = new Date(dateMillis);
        return days[date.getDay()];
    }

    scaleBetween(unscaledNum, max, min = 0, minAllowed = 0, maxAllowed = 3840) {
        return parseInt((maxAllowed - minAllowed) * (unscaledNum - min) / (max - min) + minAllowed);
    }

    /**
     * round date to given number of minutes
     * 
     * @param {Number} minutes 
     * @param {Date} d
     */
    getRoundedDate(minutes, d = new Date()) {
        let ms = 1000 * 60 * minutes; // convert minutes to ms
        let roundedDate = new Date(Math.round(d.getTime() / ms) * ms);
        return roundedDate
    }
    /**
     * format time with locale formatting
     * 
     * @param {Number} time 
     */
    toTimeString(time) {
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
    toTimeFrameString(start, stop) {
        return this.toTimeString(start) + " - " + this.toTimeString(stop);
    }

    toDuration(start, end) {
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
        //return 1607462851000;
        return Date.now();
    }
}