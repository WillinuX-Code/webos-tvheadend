import React, { Component } from 'react';
import Rect from '../models/Rect';
import EPGUtils from '../utils/EPGUtils';
import '../styles/app.css';
import CanvasUtils from '../utils/CanvasUtils';

export default class ChannelList extends Component {

    static VERTICAL_SCROLL_TOP_PADDING_ITEM = 5;

    constructor(props) {
        super(props);

        this.showEpgHandler = props.showEpgHandler;
        this.showTvHandler = props.showTvHandler;
        this.handleKeyPress = this.handleKeyPress.bind(this);
        this.epgData = props.epgData;
        this.imageCache = props.imageCache;
        this.channelPosition = props.channelPosition;
        this.scrollY = 0;
        this.epgUtils = new EPGUtils();
        this.canvasUtils = new CanvasUtils();
        this.mMaxVerticalScroll = 0;

        this.mChannelLayoutTextSize = 32;
        this.mChannelLayoutTextColor = '#d6d6d6';
        this.mChannelLayoutTitleTextColor = '#c6c6c6';
        this.mChannelLayoutMargin = 3;
        this.mChannelLayoutPadding = 7;
        this.mChannelLayoutHeight = 90;
        this.mChannelLayoutWidth = 900;
        this.mChannelLayoutBackground = '#323232';
        this.mChannelLayoutBackgroundFocus = 'rgba(65,182,230,1)';

        this.reapeater = {};
    }

    showAtChannelPosition(channelPosition) {
        this.scrollToChannelPosition(channelPosition, false);
        this.focus();
    }

    getTopFrom(position) {
        let y = position * (this.mChannelLayoutHeight); //+ this.mChannelLayoutMargin;
        return y - this.scrollY;
    }

    calculateMaxVerticalScroll() {
        let maxVerticalScroll = this.getTopFrom(this.epgData.getChannelCount() - 1) + this.mChannelLayoutHeight;
        this.mMaxVerticalScroll = maxVerticalScroll < this.getHeight() ? 0 : maxVerticalScroll - this.getHeight();
    }

    scrollToChannelPosition(channelPosition, withAnimation) {
        this.channelPosition = channelPosition;
        // start scrolling after padding position top
        if (channelPosition < ChannelList.VERTICAL_SCROLL_TOP_PADDING_ITEM) {
            this.scrollY = 0;
            this.updateCanvas();
            return;
        }

        // stop scrolling before padding position bottom
        if (channelPosition >= this.epgData.getChannelCount() - 1 - ChannelList.VERTICAL_SCROLL_TOP_PADDING_ITEM) {
            this.updateCanvas();
            return;
        }

        // scroll to channel position
        let scrollTarget = this.mChannelLayoutHeight * (channelPosition - ChannelList.VERTICAL_SCROLL_TOP_PADDING_ITEM);  
        if(!withAnimation) {
            this.scrollY = scrollTarget;
            this.updateCanvas();
            return;
        }
        
        let scrollDistance = scrollTarget - this.scrollY;
        let scrollDelta = scrollDistance / (this.mChannelLayoutHeight / 5);
        cancelAnimationFrame(this.reapeater);
        this.reapeater = requestAnimationFrame(() => {
            this.animateScroll(scrollDelta, scrollTarget);
        });
        //console.log("Scrolled to y=%d, position=%d", this.scrollY, this.channelPosition);
        //this.updateCanvas();
    }

    animateScroll(scrollDelta, scrollTarget) {
        if(scrollDelta < 0 && this.scrollY <= scrollTarget) {
            //this.scrollY = scrollTarget;
            cancelAnimationFrame(this.reapeater);
            return;
        }
        if(scrollDelta > 0 && this.scrollY >= scrollTarget) {
            //this.scrollY = scrollTarget;
            cancelAnimationFrame(this.reapeater);
            return;
        }
        //console.log("scrolldelta=%d, scrolltarget=%d, scrollY=%d", scrollDelta, scrollTarget, this.scrollY);
        this.scrollY += scrollDelta;
        this.updateCanvas();
        this.reapeater=requestAnimationFrame(() => {
            this.animateScroll(scrollDelta, scrollTarget);
        });
    }

    drawChannelListItems(canvas) {
        // Background
        let drawingRect = new Rect();
        drawingRect.left = 0;
        drawingRect.top = 0;
        drawingRect.right = drawingRect.left + this.mChannelLayoutWidth;
        drawingRect.bottom = drawingRect.top + this.getHeight();
        canvas.globalAlpha = 1.0;
        // put stroke color to transparent
        canvas.strokeStyle = "transparent";
        //mPaint.setColor(mChannelLayoutBackground);
        // canvas.fillStyle = this.mChannelLayoutBackground;
        // Create gradient
        var grd = canvas.createLinearGradient(drawingRect.bottom, drawingRect.top, drawingRect.bottom, drawingRect.bottom);
        // Important bit here is to use rgba()
        grd.addColorStop(0, "rgba(35, 64, 84, 0.6)");
        grd.addColorStop(0.1, "rgba(35, 64, 84, 0.9)");
        grd.addColorStop(0.9, "rgba(35, 64, 84, 0.9)");
        grd.addColorStop(1, 'rgba(35, 64, 84, 0.6)');

        // Fill with gradient
        canvas.fillStyle = grd;
        canvas.fillRect(drawingRect.left, drawingRect.top, drawingRect.width, drawingRect.height);

        let firstPos = this.getFirstVisibleChannelPosition();
        let lastPos = this.getLastVisibleChannelPosition();

        //console.log("Channel: First: " + firstPos + " Last: " + lastPos);
        let transparentTop = firstPos + 3;
        let transparentBottom = lastPos - 3;
        canvas.globalAlpha = 0.0;
        for (let pos = firstPos; pos < lastPos; pos++) {
            if (pos <= transparentTop) {
                canvas.globalAlpha += 0.25;
            } else if (pos >= transparentBottom) {
                canvas.globalAlpha -= 0.25;
            } else {
                canvas.globalAlpha = 1;
            }
            this.drawChannelItem(canvas, pos, drawingRect);
        }
    }

    drawChannelItem(canvas, position, drawingRect) {
        drawingRect.left = this.mChannelLayoutMargin;
        drawingRect.top = this.getTopFrom(position);
        drawingRect.right = drawingRect.left + this.mChannelLayoutWidth;
        drawingRect.bottom = drawingRect.top + this.mChannelLayoutHeight;

        if (position === this.channelPosition) {
            canvas.fillStyle = this.mChannelLayoutBackgroundFocus;
            canvas.fillRect(drawingRect.left, drawingRect.top, drawingRect.width, drawingRect.height);
        }

        let channel = this.epgData.getChannel(position);
        // channel number
        drawingRect.left += 50;
        canvas.font = "bold " + (this.mChannelLayoutTextSize + 6) + "px Arial";
        canvas.fillStyle = this.mChannelLayoutTextColor;
        canvas.textAlign = 'right';
        canvas.fillText(channel.getChannelID(),
            drawingRect.left, drawingRect.top + this.mChannelLayoutHeight / 2 + this.mChannelLayoutTextSize / 2);

        // channel name
        drawingRect.left += 15;
        canvas.font = "bold " + this.mChannelLayoutTextSize + "px Arial";
        canvas.textAlign = 'left';
        canvas.fillText(this.canvasUtils.getShortenedText(canvas, channel.getName(), drawingRect),
            drawingRect.left, drawingRect.top + this.mChannelLayoutTextSize + this.mChannelLayoutPadding);

        // channel event
        canvas.font = "italic " + (this.mChannelLayoutTextSize - 5) + "px Arial";
        canvas.fillStyle = this.mChannelLayoutTitleTextColor;
        canvas.textAlign = 'left';
        for (let event of channel.getEvents()) {
            if (event.isCurrent()) {
                canvas.fillText(this.canvasUtils.getShortenedText(canvas, event.getTitle(), drawingRect),
                    drawingRect.left, drawingRect.top + (2 * this.mChannelLayoutTextSize) + this.mChannelLayoutPadding);
                break;
            }
        };

        // channel logo
        drawingRect.left = drawingRect.right - this.mChannelLayoutHeight * 1.5;
        let imageURL = channel.getImageURL();
        let image = this.imageCache.get(imageURL);
        if (image !== undefined) {
            canvas.textAlign = 'left';
            drawingRect = this.getDrawingRectForChannelImage(drawingRect, image);
            canvas.drawImage(image, drawingRect.left, drawingRect.top, drawingRect.width, drawingRect.height);
        }
    }

    getDrawingRectForChannelImage(drawingRect, image) {
        drawingRect.left += this.mChannelLayoutPadding;
        drawingRect.top += this.mChannelLayoutPadding;
        drawingRect.right -= this.mChannelLayoutPadding;
        drawingRect.bottom -= this.mChannelLayoutPadding;

        let imageWidth = image.width;
        let imageHeight = image.height;
        let imageRatio = imageHeight / parseFloat(imageWidth);

        let rectWidth = drawingRect.right - drawingRect.left;
        let rectHeight = drawingRect.bottom - drawingRect.top;

        // Keep aspect ratio.
        if (imageWidth > imageHeight) {
            let padding = parseInt((rectHeight - (rectWidth * imageRatio)) / 2);
            drawingRect.top += padding;
            drawingRect.bottom -= padding;
        } else if (imageWidth <= imageHeight) {
            let padding = parseInt((rectWidth - (rectHeight / imageRatio)) / 2);
            drawingRect.left += padding;
            drawingRect.right -= padding;
        }

        return drawingRect;
    }

    /**
     * get first visible channel position
     */
    getFirstVisibleChannelPosition() {
        let y = this.scrollY;

        let position = parseInt((y ) /
            (this.mChannelLayoutHeight ));

        if (position < 0) {
            position = 0;
        }
        //console.log("First visible item: ", position);
        return position;
    }

    getLastVisibleChannelPosition() {
        let y = this.scrollY;
        let screenHeight = this.getHeight();
        let position = parseInt((y + screenHeight ) /
            (this.mChannelLayoutHeight ));

        if (position < this.epgData.getChannelCount()) {
            position += 1;
        }
        //console.log("Last visible item: ", position);
        return position;
    }

    recalculateAndRedraw(withAnimation) {
        if (this.epgData !== null && this.epgData.hasData()) {
            this.calculateMaxVerticalScroll();
            this.scrollToChannelPosition(this.channelPosition, withAnimation);

            this.updateCanvas();
        }
    }

    getWidth() {
        return this.mChannelLayoutWidth;
    }

    getHeight() {
        return window.innerHeight;
    }

    componentDidMount() {
        this.recalculateAndRedraw(false);
        this.focus();
    }

    componentDidUpdate(prevProps) {
        this.updateCanvas();

        //this.setFocus();
    }

    focus() {
        this.refs.list.focus();
    }

    handleKeyPress(event) {
        let keyCode = event.keyCode;
        let channelPosition = this.channelPosition;
        switch (keyCode) {
            case 33:    // programm up
            case 38:    // arrow up

                event.preventDefault();
                // channel down
                if (channelPosition === 0) {
                    return
                }
                channelPosition -= 1;
                this.scrollToChannelPosition(channelPosition, true);
                break;
            case 34: // programm down
            case 40: // arrow down
                event.preventDefault();
                // channel up
                if (channelPosition === this.epgData.getChannelCount() - 1) {
                    return;
                }
                channelPosition += 1;
                this.scrollToChannelPosition(channelPosition, true);
                break;
            case 404: // TODO yellow button + back button
            case 67: // keyboard 'c'
            case 461: // back button
                this.showTvHandler();
                break;
            case 13: // ok button -> switch to focused channel
                this.showTvHandler(channelPosition);
                break;
            case 403: // red button trigger recording
                // add current viewing channel to records
                // red button to trigger or cancel recording
                // get current event
                // this.focusedEvent = this.epgData.getEvent(channelPosition, programPosition);
                // if (this.focusedEvent.isPastDated(this.getNow())) {
                //   // past dated do nothing
                //   return;
                // }
                // // check if event is already marked for recording
                // let recEvent = this.epgData.getRecording(this.focusedEvent);
                // if (recEvent) {
                //   // cancel recording
                //   this.tvhDataService.cancelRec(recEvent, recordings => {
                //     this.epgData.updateRecordings(recordings);
                //     this.updateCanvas();
                //   });
                // } else { // creat new recording from event
                //   this.tvhDataService.createRec(this.focusedEvent, recordings => {
                //     this.epgData.updateRecordings(recordings);
                //     this.updateCanvas();
                //   });
                // }
                break;
            default:
                console.log("ChannelList-keyPressed:", keyCode);
        }
    };

    updateCanvas() {
        this.ctx = this.refs.canvas.getContext('2d');
        // clear
        this.ctx.clearRect(0, 0, this.getWidth(), this.getHeight());
        // draw children “components”
        this.onDraw(this.ctx)
    }

    onDraw(canvas) {
        if (this.epgData !== null && this.epgData.hasData()) {
            this.drawChannelListItems(canvas);
        }
    }

    getCanvas() {
        return this.refs.canvas;
    }

    render() {
        return (
            <div id="channellist-wrapper" ref="list" tabIndex='-1' onKeyDown={this.handleKeyPress} className="channelList">
                <canvas ref="canvas"
                    width={this.getWidth()}
                    height={this.getHeight()}
                    style={{ border: 'none' }}/>
            </div>
        );
    }
}