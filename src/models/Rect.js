/**
 * Created by satadru on 3/30/17.
 */
export default class Rect {

    /**
     * create new instance
     * 
     * @param {Number} top 
     * @param {Number} left 
     * @param {Number} bottom 
     * @param {Number} right 
     */
    constructor(top = 0, left = 0, bottom = 0, right = 0) {
        this._top = top;
        this._left = left;
        this._bottom = bottom;
        this._right = right;
    }

    get top() {
        return this._top;
    }

    set top(top) {
        this._top = top;
    }

    get left() {
        return this._left;
    }

    set left(left) {
        this._left = left;
    }

    get bottom() {
        return this._bottom;
    }

    set bottom(bottom) {
        this._bottom = bottom;
    }

    get right() {
        return this._right;
    }

    set right(right) {
        this._right = right;
    }

    get width() {
        return this._right - this._left;
    }

    get height() {
        return this._bottom - this._top;
    }

    get center() {
        return this.left + this.width / 2;
    }

    get middle() {
        return this.top + this.height / 2;
    }

    clone() {
        return new Rect(this._top, this._left, this._bottom, this._right);
    }
}