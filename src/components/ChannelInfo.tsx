import React, { Component } from 'react';
import Rect from '../models/Rect';
import EPGUtils from '../utils/EPGUtils';
import CanvasUtils from '../utils/CanvasUtils';
import EPGData from '../models/EPGData';
import { StateUpdateHandler } from './TV';
import '../styles/app.css';

export default class ChannelInfo extends Component {

    private canvas: React.RefObject<HTMLCanvasElement>;
    private infoWrapper: React.RefObject<HTMLDivElement>;
    private stateUpdateHandler: StateUpdateHandler;
    private epgData: EPGData;
    private epgUtils: EPGUtils;
    private imageCache: any;
    private channelPosition: number;
    private canvasUtils: CanvasUtils;
    private timeoutReference: NodeJS.Timeout | null;
    private intervalReference: NodeJS.Timeout | null;

    private mChannelInfoHeight = 150;
    private mChannelInfoTitleSize = 42;
    private mChannelLayoutTextColor = '#d6d6d6';
    private mChannelLayoutTitleTextColor = '#969696';
    private mChannelInfoTimeBoxWidth = 270;
    private mChannelLayoutMargin = 3;
    private mChannelLayoutPadding = 7;
    private mChannelLayoutBackground = '#323232';
    private mChannelLayoutBackgroundFocus = 'rgba(65,182,230,1)';

    constructor(public props: Readonly<any>) {
        super(props);

        this.canvas = React.createRef();
        this.infoWrapper = React.createRef();
        this.stateUpdateHandler = this.props.stateUpdateHandler;
        this.epgData = this.props.epgData;
        this.imageCache =this.props.imageCache;
        this.channelPosition = this.props.channelPosition;
        this.epgUtils = new EPGUtils(this.epgData.getLocale());
        this.canvasUtils = new CanvasUtils();

        this.timeoutReference = null;
        this.intervalReference = null;
    }

    keyPressHandler = (event: React.KeyboardEvent<HTMLDivElement>) => {
        let keyCode = event.keyCode;

        switch (keyCode) {
            case 461: // back button
            case 13: // ok button -> switch to focused channel
                // do not pass this event to parent
                event.stopPropagation();
                this.stateUpdateHandler({
                    isInfoState: false,
                    channelNumberText: ''
                });
                break;
        }

    };

    drawChannelInfo(canvas: CanvasRenderingContext2D) {
        // Background
        let drawingRect = new Rect();
        drawingRect.left = 0;
        drawingRect.top = 0;
        drawingRect.right = this.getWidth();
        drawingRect.bottom = this.getHeight();
        canvas.globalAlpha = 1.0;
        // put stroke color to transparent
        canvas.strokeStyle = "gradient";
        //mPaint.setColor(mChannelLayoutBackground);
        // canvas.fillStyle = this.mChannelLayoutBackground;
        // Create gradient
        var grd = canvas.createLinearGradient(drawingRect.left, drawingRect.left, drawingRect.right, drawingRect.left);
        // Important bit here is to use rgba()
        grd.addColorStop(0, "rgba(11, 39, 58, 0.7)");
        grd.addColorStop(0.4, "rgba(35, 64, 84, 0.9)");
        grd.addColorStop(0.6, "rgba(35, 64, 84, 0.9)");
        grd.addColorStop(1, 'rgba(11, 39, 58, 0.7)');

        // Fill with gradient
        canvas.fillStyle = grd;
        //canvas.fillStyle = "rgba(40, 40, 40, 0.7)";
        canvas.fillRect(drawingRect.left, drawingRect.top, drawingRect.width, drawingRect.bottom);

        //console.log("Channel: First: " + firstPos + " Last: " + lastPos);
        drawingRect.left += this.mChannelLayoutMargin;
        drawingRect.top += this.mChannelLayoutMargin;
        drawingRect.right -= this.mChannelLayoutMargin;
        drawingRect.bottom -= this.mChannelLayoutMargin;

        let channel = this.epgData.getChannel(this.channelPosition);

        // should not happen, but better check it
        if(!channel) return;

        // channel number
        //canvas.strokeStyle = ;
        // drawingRect.top = 70;
        // drawingRect.left += 100;
        // canvas.font = "bold " + this.mChannelInfoTextSize + "px Arial";
        // canvas.fillStyle = this.mChannelLayoutTextColor;
        // canvas.textAlign = 'right';
        // canvas.fillText(channel.getChannelID(), drawingRect.left, drawingRect.top);

        // channel name
        // drawingRect.left += 15;
        // drawingRect.top += this.mChannelInfoTitleSize + this.mChannelLayoutPadding;
        // drawingRect.right = this.getWidth();
        // canvas.font = "bold " + this.mChannelInfoTitleSize + "px Arial";
        // canvas.textAlign = 'left';
        // canvas.fillText(this.canvasUtils.getShortenedText(canvas, channel.getName(), drawingRect),
        //     drawingRect.left, drawingRect.top);

        // channel logo
        drawingRect.left += 20;
        drawingRect.top = 0;
        drawingRect.right = drawingRect.left + drawingRect.height + 50;
        //drawingRect.bottom = this.getHeight();
        canvas.textAlign = 'left';
        let imageURL = channel.getImageURL();
        let image = this.imageCache.get(imageURL);
        if (image !== undefined) {
            drawingRect = this.getDrawingRectForChannelImage(drawingRect, image);
            canvas.drawImage(image, drawingRect.left, drawingRect.top, drawingRect.width, drawingRect.height);
        }

        // channel event
        drawingRect.left += drawingRect.right + 20;
        drawingRect.right = this.getWidth();
        drawingRect.top = this.getHeight() / 2 - this.mChannelInfoTitleSize + (this.mChannelInfoTitleSize / 2) + this.mChannelLayoutPadding;
        canvas.font = this.mChannelInfoTitleSize + "px Arial";
        canvas.fillStyle = this.mChannelLayoutTextColor;
        canvas.textAlign = 'left';
        let currentEvent, nextEvent;

        for (let event of channel.getEvents()) {
            if (event.isCurrent()) {
                currentEvent = event;
                continue;
            }
            if (currentEvent) {
                nextEvent = event;
                break;
            }
        };

        if (currentEvent !== undefined) {
            let left = drawingRect.left;
            drawingRect.right -= this.mChannelInfoTimeBoxWidth;

            // draw current event
            canvas.fillText(this.canvasUtils.getShortenedText(canvas, currentEvent.getTitle(), drawingRect.width),
                drawingRect.left, drawingRect.top);

            drawingRect.right += this.mChannelInfoTimeBoxWidth;
            drawingRect.left = drawingRect.right - this.mChannelLayoutPadding - 20;
            canvas.textAlign = 'right';
            canvas.fillText(this.epgUtils.toTimeFrameString(currentEvent.getStart(), currentEvent.getEnd()),
                drawingRect.left, drawingRect.top);
            canvas.textAlign = 'left';

            // draw subtitle event
            canvas.font = 'bold ' + (this.mChannelInfoTitleSize - 8) + 'px Arial';
            drawingRect.top += this.mChannelInfoTitleSize + this.mChannelLayoutPadding;
            if (currentEvent.getSubTitle() !== undefined) {
                drawingRect.left = left;
                drawingRect.right -= this.mChannelInfoTimeBoxWidth;
                canvas.fillStyle = this.mChannelLayoutTitleTextColor;
                canvas.fillText(this.canvasUtils.getShortenedText(canvas, currentEvent.getSubTitle(), drawingRect.width),
                    drawingRect.left, drawingRect.top);

                drawingRect.right += this.mChannelInfoTimeBoxWidth;

            }

            // draw current time in programm as well as overall durations
            let runningTime = this.epgUtils.toDuration(currentEvent.getStart(), this.epgUtils.getNow());
            let totalTime = this.epgUtils.toDuration(currentEvent.getStart(), currentEvent.getEnd());
            let remainingTime = Math.ceil((currentEvent.getEnd() - this.epgUtils.getNow()) / 1000 / 60);
            drawingRect.left = drawingRect.right - this.mChannelLayoutPadding - 20;
            canvas.textAlign = 'right';
            canvas.fillText(runningTime + ' (+' + remainingTime + ') / '  + totalTime, drawingRect.left, drawingRect.top);

            // draw channel event progress bar
            let channelEventProgressRect = new Rect(0, 0, 10, this.getWidth());
            canvas.fillStyle = this.mChannelLayoutTitleTextColor;
            canvas.fillRect(channelEventProgressRect.left, channelEventProgressRect.top, channelEventProgressRect.width * currentEvent.getDoneFactor(), channelEventProgressRect.height);
        }

    }

    getDrawingRectForChannelImage(drawingRect: Rect, image: any) {
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
            let padding = (rectHeight - (rectWidth * imageRatio)) / 2;
            drawingRect.top += padding;
            drawingRect.bottom -= padding;
        } else if (imageWidth <= imageHeight) {
            let padding = (rectWidth - (rectHeight / imageRatio)) / 2;
            drawingRect.left += padding;
            drawingRect.right -= padding;
        }

        return drawingRect;
    }

    getWidth() {
        return window.innerWidth;
    }

    getHeight() {
        return this.mChannelInfoHeight;
    }

    /** set timeout to automatically unmount */
    resetUnmountTimeout() {
        this.timeoutReference && clearTimeout(this.timeoutReference);
        this.timeoutReference = setTimeout(() => this.stateUpdateHandler({
            isInfoState: false,
            channelNumberText: ''
        }), 8000);
    }

    componentDidMount() {
        this.focus();

        // update the canvas in short intervals, to display the remaining time live
        this.intervalReference = setInterval(() => {
            this.updateCanvas();
        }, 500);

        let channel = this.epgData.getChannel(this.channelPosition);
        this.stateUpdateHandler({ 
            channelNumberText: channel?.getChannelID() || ''
        });

        this.channelPosition = this.props.channelPosition;
        this.updateCanvas();
        this.resetUnmountTimeout();
    }

    componentDidUpdate(prevProps: any, prevState: any) {
        this.channelPosition = this.props.channelPosition;
        this.updateCanvas();
        this.resetUnmountTimeout();
    }

    componentWillUnmount() {
        this.timeoutReference && clearTimeout(this.timeoutReference);
        this.intervalReference && clearInterval(this.intervalReference);
    }

    focus() {
        this.infoWrapper.current?.focus();
    }

    updateCanvas() {
        if (this.canvas.current) {
            let ctx = this.canvas.current.getContext('2d');
            // clear
            ctx && ctx.clearRect(0, 0, this.getWidth(), this.getHeight());

            // draw child elements
            ctx && this.onDraw(ctx);
        }
    }

    onDraw(canvas: CanvasRenderingContext2D) {
        if (this.epgData !== null && this.epgData.hasData()) {
            this.drawChannelInfo(canvas);
        }
    }

    render() {
        return (
            <div id="channelinfo-wrapper" ref={this.infoWrapper} tabIndex={-1} onKeyDown={this.keyPressHandler} className="channelInfo">
                <canvas ref={this.canvas} width={this.getWidth()} height={this.getHeight()} style={{ display: "block" }} />
            </div>
        );
    }
}