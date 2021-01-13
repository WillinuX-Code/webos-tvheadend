/**
 * Created by satadru on 3/30/17.
 */
export default class Rect {

    constructor(private _top = 0, private _left = 0, private _bottom = 0, private _right = 0) {

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