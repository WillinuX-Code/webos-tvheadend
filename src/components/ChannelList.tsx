import React, { Component } from 'react';
import Rect from '../models/Rect';
import '../styles/app.css';
import CanvasUtils from '../utils/CanvasUtils';
import EPGData from '../models/EPGData';
import { StateUpdateHandler } from './TV';

export default class ChannelList extends Component {
    static VERTICAL_SCROLL_TOP_PADDING_ITEM = 5;
    static IS_DEBUG = false;

    private canvas: React.RefObject<HTMLCanvasElement>;
    private listWrapper: React.RefObject<HTMLDivElement>;
    private stateUpdateHandler: StateUpdateHandler;
    private epgData: EPGData;
    private imageCache: any;
    private channelPosition: number;
    private scrollY: number;
    private canvasUtils: CanvasUtils;
    private reapeater: any;

    private mMaxVerticalScroll = 0;
    private mChannelLayoutTextSize = 32;
    private mChannelLayoutEventTextSize = 26;
    private mChannelLayoutNumberTextSize = 38;
    private mChannelLayoutTextColor = '#d6d6d6';
    private mChannelLayoutTitleTextColor = '#969696';
    private mChannelLayoutMargin = 3;
    private mChannelLayoutPadding = 7;
    private mChannelLayoutHeight = 90;
    private mChannelLayoutWidth = 900;
    private mChannelLayoutBackground = '#323232';
    private mChannelLayoutBackgroundFocus = 'rgba(65,182,230,1)';

    constructor(public props: Readonly<any>) {
        super(props);

        this.canvas = React.createRef();
        this.listWrapper = React.createRef();
        this.stateUpdateHandler = props.stateUpdateHandler;
        this.epgData = props.epgData;
        this.imageCache = props.imageCache;
        this.channelPosition = props.channelPosition;
        this.scrollY = 0;
        this.canvasUtils = new CanvasUtils();
        this.mMaxVerticalScroll = 0;

        this.reapeater = {};
    }

    showAtChannelPosition(channelPosition: number) {
        this.scrollToChannelPosition(channelPosition, false);
        this.focus();
    }

    getTopFrom(position: number) {
        const y = position * this.mChannelLayoutHeight; //+ this.mChannelLayoutMargin;
        return y - this.scrollY;
    }

    calculateMaxVerticalScroll() {
        const maxVerticalScroll = this.getTopFrom(this.epgData.getChannelCount() - 1) + this.mChannelLayoutHeight;
        this.mMaxVerticalScroll = maxVerticalScroll < this.getHeight() ? 0 : maxVerticalScroll - this.getHeight();
    }

    scrollToChannelPosition(channelPosition: number, withAnimation: boolean) {
        this.channelPosition = channelPosition;
        // start scrolling after padding position top
        if (channelPosition < ChannelList.VERTICAL_SCROLL_TOP_PADDING_ITEM) {
            this.scrollY = 0;
            this.updateCanvas();
            return;
        }

        // stop scrolling before top padding position
        const maxPosition = this.epgData.getChannelCount() - ChannelList.VERTICAL_SCROLL_TOP_PADDING_ITEM;
        if (channelPosition >= maxPosition) {
            // fix scroll to channel in case it is within bottom padding
            if (this.scrollY === 0) {
                this.scrollY = this.mChannelLayoutHeight * (maxPosition - ChannelList.VERTICAL_SCROLL_TOP_PADDING_ITEM);
            }
            this.updateCanvas();
            return;
        }

        // scroll to channel position
        const scrollTarget =
            this.mChannelLayoutHeight * (channelPosition - ChannelList.VERTICAL_SCROLL_TOP_PADDING_ITEM);
        if (!withAnimation) {
            this.scrollY = scrollTarget;
            this.updateCanvas();
            return;
        }

        const scrollDistance = scrollTarget - this.scrollY;
        const scrollDelta = scrollDistance / (this.mChannelLayoutHeight / 5);
        // stop existing animation if we have a new request
        cancelAnimationFrame(this.reapeater);
        this.reapeater = requestAnimationFrame(() => {
            this.animateScroll(scrollDelta, scrollTarget);
        });
        //console.log("Scrolled to y=%d, position=%d", this.scrollY, this.channelPosition);
        //this.updateCanvas();
    }

    animateScroll(scrollDelta: number, scrollTarget: number) {
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

    drawChannelListItems(canvas: CanvasRenderingContext2D) {
        // Background
        const drawingRect = new Rect();
        drawingRect.left = 0;
        drawingRect.top = 0;
        drawingRect.right = drawingRect.left + this.mChannelLayoutWidth;
        drawingRect.bottom = drawingRect.top + this.getHeight();
        canvas.globalAlpha = 1.0;
        // put stroke color to transparent
        //canvas.strokeStyle = "transparent";
        canvas.strokeStyle = 'gradient';
        //mPaint.setColor(mChannelLayoutBackground);
        // canvas.fillStyle = this.mChannelLayoutBackground;
        // Create gradient
        const grd = canvas.createLinearGradient(
            drawingRect.bottom,
            drawingRect.top,
            drawingRect.bottom,
            drawingRect.bottom
        );
        // Important bit here is to use rgba()
        grd.addColorStop(0, 'rgba(11, 39, 58, 0.7)');
        grd.addColorStop(0.2, 'rgba(35, 64, 84, 0.9)');
        grd.addColorStop(0.8, 'rgba(35, 64, 84, 0.9)');
        grd.addColorStop(1, 'rgba(11, 39, 58, 0.7)');

        // Fill with gradient
        canvas.fillStyle = grd;
        canvas.fillRect(drawingRect.left, drawingRect.top, drawingRect.width, drawingRect.height);

        const firstPos = this.getFirstVisibleChannelPosition();
        const lastPos = this.getLastVisibleChannelPosition();

        //console.log("Channel: First: " + firstPos + " Last: " + lastPos);
        //let transparentTop = firstPos + 3;
        //let transparentBottom = lastPos - 3;
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

    drawChannelItem(canvas: CanvasRenderingContext2D, position: number) {
        const isSelectedChannel = position === this.channelPosition;
        const channel = this.epgData.getChannel(position);
        const drawingRect = new Rect();

        // should not happen, but better check it
        if (!channel) return;

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
        this.canvasUtils.writeText(
            canvas,
            channel.getChannelID().toString(),
            drawingRect.left + 70,
            drawingRect.middle,
            {
                fontSize: this.mChannelLayoutNumberTextSize,
                textAlign: 'right',
                fillStyle: this.mChannelLayoutTextColor,
                isBold: true
            }
        );

        // channel name
        const channelIconWidth = this.mChannelLayoutHeight * 1.3;
        const channelNameWidth = this.mChannelLayoutWidth - channelIconWidth - 90;
        this.canvasUtils.writeText(
            canvas,
            channel.getName(),
            drawingRect.left + 90,
            drawingRect.top + this.mChannelLayoutHeight * 0.33,
            {
                fontSize: this.mChannelLayoutTextSize,
                fillStyle: this.mChannelLayoutTextColor,
                isBold: true,
                maxWidth: channelNameWidth
            }
        );

        // channel event
        channel.getEvents().forEach((event) => {
            if (event.isCurrent()) {
                // channel event progress bar
                const channelEventProgressRect = new Rect();
                channelEventProgressRect.left = drawingRect.left + 90;
                channelEventProgressRect.right = channelEventProgressRect.left + 80;
                channelEventProgressRect.top = drawingRect.top + this.mChannelLayoutHeight * 0.66;
                channelEventProgressRect.bottom = channelEventProgressRect.top + this.mChannelLayoutEventTextSize * 0.5;
                canvas.strokeStyle = this.mChannelLayoutTextColor;
                canvas.strokeRect(
                    channelEventProgressRect.left,
                    channelEventProgressRect.top,
                    channelEventProgressRect.width,
                    channelEventProgressRect.height
                );
                canvas.fillStyle = isSelectedChannel ? this.mChannelLayoutTextColor : this.mChannelLayoutTitleTextColor;
                canvas.fillRect(
                    channelEventProgressRect.left + 2,
                    channelEventProgressRect.top + 2,
                    (channelEventProgressRect.width - 4) * event.getDoneFactor(),
                    channelEventProgressRect.height - 4
                );

                // channel event text
                const channelEventWidth =
                    this.mChannelLayoutWidth - channelIconWidth - 90 - channelEventProgressRect.width;
                this.canvasUtils.writeText(
                    canvas,
                    event.getTitle(),
                    channelEventProgressRect.right + this.mChannelLayoutPadding,
                    channelEventProgressRect.middle,
                    {
                        fontSize: this.mChannelLayoutEventTextSize,
                        fillStyle: canvas.fillStyle,
                        maxWidth: channelEventWidth
                    }
                );
            }
        });

        // channel logo
        const imageURL = channel.getImageURL();
        const image = this.imageCache.get(imageURL);
        if (image !== undefined) {
            const channelImageRect = this.getDrawingRectForChannelImage(position, image);
            canvas.drawImage(
                image,
                channelImageRect.left,
                channelImageRect.top,
                channelImageRect.width,
                channelImageRect.height
            );
            this.drawDebugRect(canvas, channelImageRect);
        }
    }

    drawDebugRect(canvas: CanvasRenderingContext2D, drawingRect: Rect) {
        if (ChannelList.IS_DEBUG) {
            canvas.strokeStyle = '#FF0000';
            canvas.strokeRect(drawingRect.left, drawingRect.top, drawingRect.width, drawingRect.height);
        }
    }

    getDrawingRectForChannelImage(position: number, image: any) {
        const drawingRect = new Rect();
        drawingRect.right = this.mChannelLayoutWidth - this.mChannelLayoutMargin;
        drawingRect.left = drawingRect.right - this.mChannelLayoutHeight * 1.3;
        drawingRect.top = this.getTopFrom(position);
        drawingRect.bottom = drawingRect.top + this.mChannelLayoutHeight;

        const imageWidth = image.width;
        const imageHeight = image.height;
        const imageRatio = imageHeight / parseFloat(imageWidth);

        const rectWidth = drawingRect.right - drawingRect.left;
        const rectHeight = drawingRect.bottom - drawingRect.top;

        // Keep aspect ratio.
        if (imageWidth > imageHeight) {
            const padding = (rectHeight - rectWidth * imageRatio) / 2;
            drawingRect.top += padding;
            drawingRect.bottom -= padding;
        } else if (imageWidth <= imageHeight) {
            const padding = (rectWidth - rectHeight / imageRatio) / 2;
            drawingRect.left += padding;
            drawingRect.right -= padding;
        }

        return drawingRect;
    }

    /**
     * get first visible channel position
     */
    getFirstVisibleChannelPosition() {
        const y = this.scrollY;
        let position = Math.floor(y / this.mChannelLayoutHeight);

        if (position < 0) {
            position = 0;
        }
        //console.log("First visible item: ", position);
        return position;
    }

    getLastVisibleChannelPosition() {
        const y = this.scrollY;
        const screenHeight = this.getHeight();
        let position = Math.floor((y + screenHeight) / this.mChannelLayoutHeight);

        const channelCount = this.epgData.getChannelCount();
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

    recalculateAndRedraw(withAnimation: boolean) {
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

    componentDidUpdate(prevProps: any) {
        this.updateCanvas();
    }

    componentWillUnmount() {
        // stop animation when unmounting
        cancelAnimationFrame(this.reapeater);
    }

    focus() {
        this.listWrapper.current?.focus();
    }

    keyPressHandler = (event: React.KeyboardEvent<HTMLDivElement>) => {
        const keyCode = event.keyCode;
        let channelPosition = this.channelPosition;

        event.stopPropagation();
        switch (keyCode) {
            case 33: // programm up
            case 38: // arrow up
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
                console.log('ChannelList-keyPressed:', keyCode);
        }
    };

    updateCanvas() {
        if (this.canvas.current) {
            const ctx = this.canvas.current.getContext('2d');
            // clear
            ctx && ctx.clearRect(0, 0, this.getWidth(), this.getHeight());

            // draw child elements
            ctx && this.onDraw(ctx);
        }
    }

    onDraw(canvas: CanvasRenderingContext2D) {
        if (this.epgData !== null && this.epgData.hasData()) {
            this.drawChannelListItems(canvas);
        }
    }

    render() {
        return (
            <div
                id="channellist-wrapper"
                ref={this.listWrapper}
                tabIndex={-1}
                onKeyDown={this.keyPressHandler}
                className="channelList"
            >
                <canvas
                    ref={this.canvas}
                    width={this.getWidth()}
                    height={this.getHeight()}
                    style={{ display: 'block' }}
                />
            </div>
        );
    }
}
