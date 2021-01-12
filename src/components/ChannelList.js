import React, { Component } from 'react';
import Rect from '../models/Rect';
import EPGUtils from '../utils/EPGUtils';
import '../styles/app.css';
import CanvasUtils from '../utils/CanvasUtils';

export default class ChannelList extends Component {

    static VERTICAL_SCROLL_TOP_PADDING_ITEM = 5;
    static IS_DEBUG = false;

    constructor(props) {
        super(props);

        this.stateUpdateHandler = props.stateUpdateHandler;
        this.handleKeyPress = this.handleKeyPress.bind(this);
        this.epgData = props.epgData;
        this.imageCache = props.imageCache;
        this.channelPosition = props.channelPosition;
        this.scrollY = 0;
        this.epgUtils = new EPGUtils(this.epgData.getLocale());
        this.canvasUtils = new CanvasUtils();
        this.mMaxVerticalScroll = 0;

        this.mChannelLayoutTextSize = 32;
        this.mChannelLayoutEventTextSize = 26;
        this.mChannelLayoutNumberTextSize = 38;
        this.mChannelLayoutTextColor = '#d6d6d6';
        this.mChannelLayoutTitleTextColor = '#969696';
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

        // stop scrolling before top padding position
        let maxPosition = this.epgData.getChannelCount() - ChannelList.VERTICAL_SCROLL_TOP_PADDING_ITEM;
        if (channelPosition >= maxPosition) {
            // fix scroll to channel in case it is within bottom padding
            if (this.scrollY === 0) {
                this.scrollY = this.mChannelLayoutHeight * (maxPosition - ChannelList.VERTICAL_SCROLL_TOP_PADDING_ITEM);
            }
            this.updateCanvas();
            return;
        }

        // scroll to channel position
        let scrollTarget = this.mChannelLayoutHeight * (channelPosition - ChannelList.VERTICAL_SCROLL_TOP_PADDING_ITEM);
        if (!withAnimation) {
            this.scrollY = scrollTarget;
            this.updateCanvas();
            return;
        }

        let scrollDistance = scrollTarget - this.scrollY;
        let scrollDelta = scrollDistance / (this.mChannelLayoutHeight / 5);
        // stop existing animation if we have a new request
        cancelAnimationFrame(this.reapeater);
        this.reapeater = requestAnimationFrame(() => {
            this.animateScroll(scrollDelta, scrollTarget);
        });
        //console.log("Scrolled to y=%d, position=%d", this.scrollY, this.channelPosition);
        //this.updateCanvas();
    }

    animateScroll(scrollDelta, scrollTarget) {
        if (scrollDelta < 0 && this.scrollY <= scrollTarget) {
            //this.scrollY = scrollTarget;
            cancelAnimationFrame(this.reapeater);
            return;
        }
        if (scrollDelta > 0 && this.scrollY >= scrollTarget) {
            //this.scrollY = scrollTarget;
            cancelAnimationFrame(this.reapeater);
            return;
        }
        //console.log("scrolldelta=%d, scrolltarget=%d, scrollY=%d", scrollDelta, scrollTarget, this.scrollY);
        this.scrollY += scrollDelta;
        this.updateCanvas();
        this.reapeater = requestAnimationFrame(() => {
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
        //canvas.strokeStyle = "transparent";
        canvas.strokeStyle = "gradient";
        //mPaint.setColor(mChannelLayoutBackground);
        // canvas.fillStyle = this.mChannelLayoutBackground;
        // Create gradient
        var grd = canvas.createLinearGradient(drawingRect.bottom, drawingRect.top, drawingRect.bottom, drawingRect.bottom);
        // Important bit here is to use rgba()
        grd.addColorStop(0, "rgba(11, 39, 58, 0.7)");
        grd.addColorStop(0.2, "rgba(35, 64, 84, 0.9)");
        grd.addColorStop(0.8, "rgba(35, 64, 84, 0.9)");
        grd.addColorStop(1, 'rgba(11, 39, 58, 0.7)');

        // Fill with gradient
        canvas.fillStyle = grd;
        canvas.fillRect(drawingRect.left, drawingRect.top, drawingRect.width, drawingRect.height);

        let firstPos = this.getFirstVisibleChannelPosition();
        let lastPos = this.getLastVisibleChannelPosition();

        //console.log("Channel: First: " + firstPos + " Last: " + lastPos);
        let transparentTop = firstPos + 3;
        let transparentBottom = lastPos - 3;
        canvas.globalAlpha = 1.0;
        for (let pos = firstPos; pos < lastPos; pos++) {
            // if (pos <= transparentTop) {
            //     canvas.globalAlpha += 0.25;
            // } else if (pos >= transparentBottom) {
            //     canvas.globalAlpha -= 0.25;
            // } else {
            //     canvas.globalAlpha = 1;
            // }
            this.drawChannelItem(canvas, pos);
        }
    }

    drawChannelItem(canvas, position) {
        let isSelectedChannel = (position === this.channelPosition);
        let channel = this.epgData.getChannel(position);
        let drawingRect = new Rect();
        drawingRect.left = 0;
        drawingRect.top = this.getTopFrom(position);
        drawingRect.right = this.mChannelLayoutWidth;
        drawingRect.bottom = drawingRect.top + this.mChannelLayoutHeight;
        this.drawDebugRect(canvas, drawingRect);

        // highlight selected channel
        if (isSelectedChannel) {
            canvas.fillStyle = this.mChannelLayoutBackgroundFocus;
            canvas.fillRect(drawingRect.left, drawingRect.top, drawingRect.width, drawingRect.height);
        }

        // channel number
        let channelNumberRect = new Rect();
        channelNumberRect.top = drawingRect.top + drawingRect.height / 2 - this.mChannelLayoutNumberTextSize / 2;
        channelNumberRect.bottom = channelNumberRect.top + this.mChannelLayoutNumberTextSize;
        channelNumberRect.left = drawingRect.left;
        channelNumberRect.right = drawingRect.left + 70;
        canvas.font = 'bold ' + this.mChannelLayoutNumberTextSize + 'px Arial';
        canvas.fillStyle = this.mChannelLayoutTextColor;
        canvas.textAlign = 'right';
        canvas.fillText(channel.getChannelID(), channelNumberRect.right, channelNumberRect.top + channelNumberRect.height * 0.75);
        this.drawDebugRect(canvas, channelNumberRect);

        // channel name
        let channelNameRect = new Rect(drawingRect.top, channelNumberRect.right + 20, drawingRect.top + this.mChannelLayoutTextSize, drawingRect.right);
        channelNameRect.top = drawingRect.top + this.mChannelLayoutTextSize / 2;
        channelNameRect.bottom = channelNameRect.top + this.mChannelLayoutTextSize;
        channelNameRect.left = channelNumberRect.right + 20;
        channelNameRect.right = this.mChannelLayoutWidth - this.mChannelLayoutHeight * 1.3 - this.mChannelLayoutPadding;
        canvas.font = 'bold ' + this.mChannelLayoutTextSize + 'px Arial';
        canvas.textAlign = 'left';
        canvas.fillText(this.canvasUtils.getShortenedText(canvas, channel.getName(), channelNameRect), channelNameRect.left, channelNameRect.top + channelNameRect.height * 0.75);
        this.drawDebugRect(canvas, channelNameRect);

        // channel event
        canvas.font = this.mChannelLayoutEventTextSize + 'px Arial';
        canvas.fillStyle = isSelectedChannel ? this.mChannelLayoutTextColor : this.mChannelLayoutTitleTextColor;
        canvas.textAlign = 'left';
        for (let event of channel.getEvents()) {
            if (event.isCurrent()) {
                // channel event progress bar
                let channelEventProgressRect = new Rect();
                channelEventProgressRect.left = channelNameRect.left;
                channelEventProgressRect.right = channelEventProgressRect.left + 80;
                channelEventProgressRect.top = channelNameRect.bottom + this.mChannelLayoutPadding;
                channelEventProgressRect.bottom = channelEventProgressRect.top + this.mChannelLayoutEventTextSize * 0.5;
                canvas.strokeStyle = this.mChannelLayoutTextColor;
                canvas.strokeRect(channelEventProgressRect.left, channelEventProgressRect.top, channelEventProgressRect.width, channelEventProgressRect.height);
                canvas.fillRect(channelEventProgressRect.left + 2, channelEventProgressRect.top + 2, (channelEventProgressRect.width - 4) * event.getDoneFactor(), channelEventProgressRect.height - 4);

                // channel event text
                let channelEventRect = channelEventProgressRect.clone();
                channelEventRect.right = this.mChannelLayoutWidth - this.mChannelLayoutHeight * 1.3 - this.mChannelLayoutPadding;
                channelEventRect.left = channelEventProgressRect.right + this.mChannelLayoutPadding;
                channelEventRect.top -= 0.25 * this.mChannelLayoutEventTextSize;
                channelEventRect.bottom += 0.25 * this.mChannelLayoutEventTextSize;
                canvas.fillText(this.canvasUtils.getShortenedText(canvas, event.getTitle(), channelEventRect),
                channelEventRect.left, channelEventRect.top + channelEventRect.height * 0.75);
                this.drawDebugRect(canvas, channelEventRect);

                break;
            }
        };

        // channel logo
        let imageURL = channel.getImageURL();
        let image = this.imageCache.get(imageURL);
        if (image !== undefined) {
            canvas.textAlign = 'left';
            let channelImageRect = this.getDrawingRectForChannelImage(position, image);
            canvas.drawImage(image, channelImageRect.left, channelImageRect.top, channelImageRect.width, channelImageRect.height);
            this.drawDebugRect(canvas, channelImageRect);
        }
    }

    drawDebugRect(canvas, drawingRect) {
        if (ChannelList.IS_DEBUG) {
            canvas.strokeStyle = '#FF0000';
            canvas.strokeRect(drawingRect.left, drawingRect.top, drawingRect.width, drawingRect.height);
        }
    }

    getDrawingRectForChannelImage(position, image) {
        let drawingRect = new Rect();
        drawingRect.right = this.mChannelLayoutWidth - this.mChannelLayoutMargin;
        drawingRect.left = drawingRect.right - this.mChannelLayoutHeight * 1.3;
        drawingRect.top = this.getTopFrom(position);
        drawingRect.bottom = drawingRect.top + this.mChannelLayoutHeight;
        
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

        let position = parseInt((y) /
            (this.mChannelLayoutHeight));

        if (position < 0) {
            position = 0;
        }
        //console.log("First visible item: ", position);
        return position;
    }

    getLastVisibleChannelPosition() {
        let y = this.scrollY;
        let screenHeight = this.getHeight();
        let position = parseInt((y + screenHeight) /
            (this.mChannelLayoutHeight));

        let channelCount = this.epgData.getChannelCount();
        // this will fade the bottom channel in while scrolling
        if (position < channelCount) {
            position += 1;
        }
        // this is the max channel available
        if (position > channelCount) {
            position = channelCount;
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

    componentWillUnmount() {
        // stop animation when unmounting
        cancelAnimationFrame(this.reapeater);
    }

    focus() {
        this.refs.list.focus();
    }

    handleKeyPress(event) {
        let keyCode = event.keyCode;
        let channelPosition = this.channelPosition;
        event.stopPropagation();
        switch (keyCode) {
            case 33:    // programm up
            case 38:    // arrow up
                // channel down
                channelPosition -= 1;
                // if we reached < 0 we scroll to end of list
                if (channelPosition < 0) {
                    channelPosition = this.epgData.getChannelCount() - 1;
                }

                this.scrollToChannelPosition(channelPosition, true);
                break;
            case 34: // programm down
            case 40: // arrow down
                // channel up
                channelPosition += 1;
                // when channel position increased channelcount we scroll to beginning
                if (channelPosition > this.epgData.getChannelCount() - 1) {
                    channelPosition = 0;
                }
                this.scrollToChannelPosition(channelPosition, true);
                break;
            case 404: // TODO yellow button + back button
            case 67: // keyboard 'c'
            case 461: // back button
                this.stateUpdateHandler({
                    isChannelListState: false
                });
                break;
            case 13: // ok button -> switch to focused channel
                this.stateUpdateHandler({
                    isChannelListState: false,
                    isInfoState: true,
                    channelPosition: channelPosition
                });
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
                    style={{ display: 'block' }} />
            </div>
        );
    }
}