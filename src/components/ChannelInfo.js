import React, { Component } from 'react';
import Rect from '../models/Rect';
import EPGUtils from '../utils/EPGUtils';
import '../styles/app.css';
import CanvasUtils from '../utils/CanvasUtils';

export default class ChannelInfo extends Component {

    constructor(props) {
        super(props);

        this.handleKeyPress = this.handleKeyPress.bind(this);
        this.stateUpdateHandler = this.props.stateUpdateHandler;
        this.epgData = this.props.epgData;
        this.imageCache =this.props.imageCache;
        this.channelPosition = this.props.channelPosition;
        this.epgUtils = new EPGUtils(this.epgData.getLocale());
        this.canvasUtils = new CanvasUtils();

        this.mChannelInfoHeight = 150;
        this.mChannelInfoTitleSize = 42;
        this.mChannelLayoutTextColor = '#d6d6d6';
        this.mChannelLayoutTitleTextColor = '#969696';
        this.mChannelInfoTimeBoxWidth = 200;
        //this.mChannelLayoutTitleTextColor = '#c6c6c6';
        this.mChannelLayoutMargin = 3;
        this.mChannelLayoutPadding = 7;
        this.mChannelLayoutBackground = '#323232';
        this.mChannelLayoutBackgroundFocus = 'rgba(65,182,230,1)';

        this.reapeater = {};
        this.timeoutReference = {};
        this.intervalReference = {};
    }

    handleKeyPress(event) {
        let keyCode = event.keyCode;

        switch (keyCode) {
            case 461: // back button
            case 13: // ok button -> switch to focused channel
                // do not pass this event to parent
                event.stopPropagation();
                this.stateUpdateHandler({
                    isInfoState: false
                });
                break;
        }

    };

    drawChannelInfo(canvas) {
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
            if (currentEvent !== undefined) {
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
            canvas.font = "bold "+(this.mChannelInfoTitleSize - 8) + "px Arial";
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

            drawingRect.left = drawingRect.right - this.mChannelLayoutPadding - 20;
            canvas.textAlign = 'right';
            canvas.fillText(this.epgUtils.toDuration(currentEvent.getStart(), this.epgUtils.getNow()) + " / " + this.epgUtils.toDuration(currentEvent.getStart(), currentEvent.getEnd()),
                drawingRect.left, drawingRect.top);
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

    getWidth() {
        return window.innerWidth;
    }

    getHeight() {
        return this.mChannelInfoHeight;
    }

    componentDidMount() {
        this.updateCanvas();
        this.focus();

        // set timeout to automatically unmount
        this.timeoutReference = setTimeout(() => this.stateUpdateHandler({
            isInfoState: false
        }), 8 * 1000);
        this.intervalReference = setInterval(() => this.updateCanvas(), 500);

    }

    componentDidUpdate(prevProps) {
        this.updateCanvas();
    }

    componentWillUnmount() {
        clearTimeout(this.timeoutReference);
        clearInterval(this.intervalReference);
    }

    focus() {
        this.refs.info.focus();
    }

    updateCanvas() {
        this.ctx = this.refs.canvas.getContext('2d');
        // clear
        this.ctx.clearRect(0, 0, this.getWidth(), this.getHeight());
        // draw children “components”
        this.onDraw(this.ctx)
    }

    /**
     * 
     * @param {CanvasRenderingContext2D} canvas 
     */
    onDraw(canvas) {
        if (this.epgData !== null && this.epgData.hasData()) {
            this.drawChannelInfo(canvas);
        }
    }

    getCanvas() {
        return this.refs.canvas;
    }

    render() {
        return (
            <div id="channelinfo-wrapper" ref="info" tabIndex='-1' onKeyDown={this.handleKeyPress} className="channelInfo">
                <canvas ref="canvas" width={this.getWidth()} height={this.getHeight()} style={{ display: 'block' }} />
            </div>
        );
    }
}