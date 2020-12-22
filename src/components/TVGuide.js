/**
 * Created by satadru on 3/31/17.
 */
import React, { Component } from 'react';

import Rect from '../models/Rect';
import ReactDOM from "react-dom";
import EPGUtils from '../utils/EPGUtils'
import '../styles/app.css'
import TVHDataService from '../services/TVHDataService';

export default class TVGuide extends Component {

    static DAYS_BACK_MILLIS = 2 * 60 * 60 * 1000; // 2 hours
    static DAYS_FORWARD_MILLIS = 1 * 24 * 60 * 60 * 1000; // 1 days
    static HOURS_IN_VIEWPORT_MILLIS = 2 * 60 * 60 * 1000; // 2 hours
    static TIME_LABEL_SPACING_MILLIS = 30 * 60 * 1000; // 30 minutes

    static VISIBLE_CHANNEL_COUNT = 10; // No of channel to show at a time
    static VERTICAL_SCROLL_BOTTOM_PADDING_ITEM = 4;
    static VERTICAL_SCROLL_TOP_PADDING_ITEM = 4;

    constructor(props) {
        super(props);

        this.showTvHandler = props.showTvHandler;
        this.handleClick = this.handleClick.bind(this);
        this.handleScroll = this.handleScroll.bind(this);
        this.handleKeyPress = this.handleKeyPress.bind(this);
        this.epgData = props.epgData;
        this.epgUtils = new EPGUtils();
        this.tvhDataService = new TVHDataService();
        this.scrollX = 0;
        this.scrollY = 0;
        this.focusedChannelPosition = props.channelPosition;
        this.focusedEventPosition = -1;
        //this.state = {translate3d : `translate3d(${this.scrollX}px, 0px, 0px)`};
        //this.translate3d = `translate3d(${this.scrollX}px, 0px, 0px)`;

        this.mChannelImageCache = props.imageCache;
        this.mClipRect = new Rect();
        this.mDrawingRect = new Rect();
        this.mMeasuringRect = new Rect();

        this.mEPGBackground = '#1e1e1e';
        this.mChannelLayoutMargin = 3;
        this.mChannelLayoutPadding = 10;
        this.mChannelLayoutHeight = 60;
        this.mChannelLayoutWidth = 120;
        this.mChannelLayoutBackground = '#323232';

        //this.mEventLayoutBackground = '#4f4f4f';
        this.mEventLayoutBackground = '#234054';
        //this.mEventLayoutBackgroundCurrent = '#4f4f4f';
        this.mEventLayoutBackgroundCurrent = '#234054';
        this.mEventLayoutBackgroundFocus = 'rgba(65,182,230,1)';
        this.mEventLayoutTextColor = '#d6d6d6';
        this.mEventLayoutTextSize = 28;
        this.mEventLayoutRecordingColor = '#da0000';

        this.mDetailsLayoutMargin = 5;
        this.mDetailsLayoutPadding = 8;
        this.mDetailsLayoutTextColor = '#d6d6d6';
        this.mDetailsLayoutTitleTextSize = 30;
        this.mDetailsLayoutDescriptionTextSize = 28;
        this.mDetailsLayoutBackground = '#2d71ac';

        this.mTimeBarHeight = 60;
        this.mTimeBarTextSize = 24;
        this.mTimeBarLineWidth = 3;
        this.mTimeBarLineColor = '#c57120';

        this.mResetButtonSize = 40;
        this.mResetButtonMargin = 10;

        this.reapeater = {};
        //this.resetBoundaries();

    }

    resetBoundaries() {
        this.mMillisPerPixel = this.calculateMillisPerPixel();
        this.mTimeOffset = this.calculatedBaseLine();
        this.mTimeLowerBoundary = this.getTimeFrom(0);
        this.mTimeUpperBoundary = this.getTimeFrom(this.getWidth());
    }

    showAtChannelPosition(channelPosition) {
        //console.log("Channel pos: ", channelPosition);
        //this.focusedChannelPosition = channelPosition;
        //this.refs.epg.style.display = 'block';
        this.recalculateAndRedraw(false);
        this.focusEPG();
        this.updateCanvas();
    }

    calculateMaxHorizontalScroll() {
        this.mMaxHorizontalScroll = parseInt(((TVGuide.DAYS_BACK_MILLIS + TVGuide.DAYS_FORWARD_MILLIS - TVGuide.HOURS_IN_VIEWPORT_MILLIS) / this.mMillisPerPixel));
    }

    calculateMaxVerticalScroll() {
        let maxVerticalScroll = this.getTopFrom(this.epgData.getChannelCount() - 1) + this.mChannelLayoutHeight;
        this.mMaxVerticalScroll = maxVerticalScroll < this.getChannelListHeight() ? 0 : maxVerticalScroll - this.getChannelListHeight();
    }

    calculateMillisPerPixel() {
        return TVGuide.HOURS_IN_VIEWPORT_MILLIS / (this.getWidth() - this.mChannelLayoutWidth - this.mChannelLayoutMargin);
    }

    calculatedBaseLine() {
        //return LocalDateTime.now().toDateTime().minusMillis(DAYS_BACK_MILLIS).getMillis();
        return this.epgUtils.getNow() - TVGuide.DAYS_BACK_MILLIS;
    }

    getProgramPosition(channelPosition, time) {
        let events = this.epgData.getEvents(channelPosition);
        if (events !== null) {
            for (let eventPos = 0; eventPos < events.length; eventPos++) {
                let event = events[eventPos];
                if (event.getStart() <= time && event.getEnd() >= time) {
                    return eventPos;
                }
            }
        }
        return -1;
    }

    getFirstVisibleChannelPosition() {
        let y = this.getScrollY(false);

        let position = parseInt((y - this.mChannelLayoutMargin - this.mTimeBarHeight) /
            (this.mChannelLayoutHeight + this.mChannelLayoutMargin));

        if (position < 0) {
            position = 0;
        }

        return position;
    }

    getLastVisibleChannelPosition() {
        let y = this.getScrollY(false);
        let screenHeight = this.getChannelListHeight();
        let position = parseInt((y + screenHeight - this.mTimeBarHeight - this.mChannelLayoutMargin) /
            (this.mChannelLayoutHeight + this.mChannelLayoutMargin));

        return position + 1;
    }

    getXFrom(time) {
        return parseInt(((time - this.mTimeLowerBoundary) / this.mMillisPerPixel) + this.mChannelLayoutMargin + this.mChannelLayoutWidth + this.mChannelLayoutMargin);
    }

    getTopFrom(position) {
        let y = position * (this.mChannelLayoutHeight + this.mChannelLayoutMargin) +
            this.mChannelLayoutMargin + this.mTimeBarHeight;
        return y - this.getScrollY(false);
    }

    getXPositionStart() {
        return this.getXFrom(this.epgUtils.getNow() - (TVGuide.HOURS_IN_VIEWPORT_MILLIS / 2));
    }


    getTimeFrom(x) {
        return (x * this.mMillisPerPixel) + this.mTimeOffset;
    }

    shouldDrawTimeLine(now) {
        return now >= this.mTimeLowerBoundary && now < this.mTimeUpperBoundary;
    }

    shouldDrawPastTimeOverlay(now) {
        return now >= this.mTimeLowerBoundary;
    }

    isEventVisible(start, end) {
        return (start >= this.mTimeLowerBoundary && start <= this.mTimeUpperBoundary) ||
            (end >= this.mTimeLowerBoundary && end <= this.mTimeUpperBoundary) ||
            (start <= this.mTimeLowerBoundary && end >= this.mTimeUpperBoundary);
    }

    getFocusedChannelPosition() {
        return this.focusedChannelPosition;
    }

    getFocusedEventPosition() {
        return this.focusedEventPosition;
    }

    isRTL() {
        return false;
    }

    getScrollX(neglect = true) {
        if (neglect) {
            return 0;
        }
        return this.scrollX;
        //return window.scrollX;
    }

    getScrollY(neglect = true) {
        if (neglect) {
            return 0;
        }
        return this.scrollY;
        //return window.scrollY;
    }

    getWidth() {
        return window.innerWidth;
    }

    getHeight() {
        return window.innerHeight;
    }

    getChannelListHeight() {
        return this.mTimeBarHeight + (this.mChannelLayoutMargin + this.mChannelLayoutHeight) * TVGuide.VISIBLE_CHANNEL_COUNT;
    }

    onDraw(canvas) {
        if (this.epgData !== null && this.epgData.hasData()) {
            this.mTimeLowerBoundary = this.getTimeFrom(this.getScrollX(false));
            this.mTimeUpperBoundary = this.getTimeFrom(this.getScrollX(false) + this.getWidth());

            let drawingRect = this.mDrawingRect;
            //console.log("X:" + this.getScrollX());
            drawingRect.left = this.getScrollX();
            drawingRect.top = this.getScrollY();
            drawingRect.right = drawingRect.left + this.getWidth();
            drawingRect.bottom = drawingRect.top + this.getHeight();
            // draw background
            canvas.fillStyle = '#000000';
            canvas.fillRect(drawingRect.left, drawingRect.top, drawingRect.width, drawingRect.height);
            this.drawChannelListItems(canvas, drawingRect);
            this.drawEvents(canvas, drawingRect);
            this.drawTimebar(canvas, drawingRect);
            //drawResetButton(canvas, drawingRect);
            this.drawFocusEvent(canvas, drawingRect);
            this.drawTimeLine(canvas, drawingRect);
            // draw details pane
            this.drawDetails(canvas, drawingRect);
        }
    }

    drawDetails(canvas, drawingRect) {
        // Background
        drawingRect.left = this.getScrollX();
        drawingRect.top = this.getChannelListHeight();
        drawingRect.right = this.getWidth();
        drawingRect.bottom = this.getHeight();
       
        canvas.fillStyle = '#000000'//this.mChannelLayoutBackground'';
        canvas.fillRect(drawingRect.left, drawingRect.top, drawingRect.width, drawingRect.height);

        // rect for logo
        drawingRect.left = this.getScrollX();
        drawingRect.top = this.getChannelListHeight();
        drawingRect.right = drawingRect.left + 300;
        drawingRect.bottom = this.getHeight();

        let channel = this.epgData.getChannel(this.getFocusedChannelPosition());
        let event = this.epgData.getEvent(this.getFocusedChannelPosition(), this.getFocusedEventPosition());
        let imageURL = channel.getImageURL();
        let image = this.mChannelImageCache.get(imageURL);
        if (image !== undefined) {
            let imageDrawingRect = this.getDrawingRectForChannelImage(drawingRect, image);
            canvas.drawImage(image, imageDrawingRect.left, imageDrawingRect.top, imageDrawingRect.width, drawingRect.height);
        }

        // rect for background
        drawingRect.left = drawingRect.right;
        drawingRect.top = this.getChannelListHeight();
        drawingRect.right = this.getWidth();
        drawingRect.bottom = this.getHeight();

        
        if (event !== undefined) {
            // rect event details
            drawingRect.left += this.mDetailsLayoutMargin;
            drawingRect.top += this.mDetailsLayoutTitleTextSize + this.mDetailsLayoutMargin;
            drawingRect.right -= this.mDetailsLayoutMargin;
            drawingRect.bottom -= this.mDetailsLayoutMargin;

            // title
            //drawingRect.top += 5;
            // draw title, description etc
            canvas.font = "bold " + this.mDetailsLayoutTitleTextSize + "px Arial";
            canvas.fillStyle = this.mDetailsLayoutTextColor;
            canvas.fillText(event.getTitle(), drawingRect.left, drawingRect.top);

            if (event.getSubTitle() !== undefined) {
                this.drawDetailsSubtitle(event.getSubTitle(), canvas, drawingRect);
            }
            this.drawDetailsTimeInfo(event, canvas, drawingRect);
            if (event.getDescription() !== undefined) {
                this.drawDetailsDescription(event.getDescription(), canvas, drawingRect);
            }
        }
    }

    drawDetailsDescription(description, canvas, drawingRect) {
        let drect = drawingRect.clone();
        drect.left = drawingRect.left;
        drect.right = this.getWidth() - 10;
        drect.top += this.mDetailsLayoutTitleTextSize * 2 + 3 * 5;
        // draw title, description etc
        canvas.font = this.mDetailsLayoutDescriptionTextSize + "px Arial";
        canvas.fillStyle = this.mDetailsLayoutTextColor;
        this.wrapText(description, canvas, drect.left, drect.top, drect.width, this.mDetailsLayoutTitleTextSize + 5);
        //canvas.fillText(description, drect.left, drect.top);
    }

    drawDetailsTimeInfo(event, canvas, drawingRect) {
        let tDrawingRect = drawingRect.clone();
        tDrawingRect.right = this.getWidth() - 10;
        canvas.font = "bold " + this.mDetailsLayoutTitleTextSize + "px Arial";
        canvas.textAlign = "right";
        canvas.fillText(this.epgUtils.toTimeString(event.getStart(), event.getEnd()), tDrawingRect.right, tDrawingRect.top);
        canvas.textAlign = "left";
    }

    drawDetailsSubtitle(subtitle, canvas, drawingRect) {
        let drect = drawingRect.clone();
        drect.left = drect.left;
        drect.top += this.mDetailsLayoutTitleTextSize + 5;
        // draw title, description etc
        canvas.font = "italic " + (this.mDetailsLayoutTitleTextSize - 4) + "px Arial";
        canvas.fillStyle = this.mDetailsLayoutTextColor;
        canvas.fillText(subtitle, drect.left, drect.top);
    }

    wrapText(text, canvas, x, y, maxWidth, lineHeight) {
        var words = text.split(" ");
        var line = "";

        for (var n = 0; n < words.length; n++) {
            var testLine = line + words[n] + " ";
            var metrics = canvas.measureText(testLine);
            var testWidth = metrics.width;
            if (testWidth > maxWidth && n > 0) {
                canvas.fillText(line, x, y);
                line = words[n] + " ";
                y += lineHeight;
            }
            else {
                line = testLine;
            }
        }
        canvas.fillText(line, x, y);
    }

    drawTimebar(canvas, drawingRect) {

        drawingRect.left = this.getScrollX() + this.mChannelLayoutWidth + this.mChannelLayoutMargin;
        drawingRect.top = this.getScrollY();
        drawingRect.right = drawingRect.left + this.getWidth();
        drawingRect.bottom = drawingRect.top + this.mTimeBarHeight;

        // Background
        canvas.fillStyle = this.mChannelLayoutBackground
        canvas.fillRect(drawingRect.left, drawingRect.top, drawingRect.width, drawingRect.height);

        // Time stamps
        //mPaint.setColor(mEventLayoutTextColor);
        //mPaint.setTextSize(mTimeBarTextSize);
        canvas.font = "bold " + this.mTimeBarTextSize + "px Arial";
        canvas.fillStyle = this.mEventLayoutTextColor;

        for (let i = 0; i < TVGuide.HOURS_IN_VIEWPORT_MILLIS / TVGuide.TIME_LABEL_SPACING_MILLIS; i++) {
            // Get time and round to nearest half hour
            let time = TVGuide.TIME_LABEL_SPACING_MILLIS *
                (((this.mTimeLowerBoundary + (TVGuide.TIME_LABEL_SPACING_MILLIS * i)) +
                    (TVGuide.TIME_LABEL_SPACING_MILLIS / 2)) / TVGuide.TIME_LABEL_SPACING_MILLIS);

            canvas.fillText(this.epgUtils.getShortTime(time),
                this.getXFrom(time),
                drawingRect.top + (((drawingRect.bottom - drawingRect.top) / 2) + (this.mTimeBarTextSize / 2)));
        }

        this.drawTimebarDayIndicator(canvas, drawingRect);
        this.drawTimebarBottomStroke(canvas, drawingRect);
    }

    drawTimebarDayIndicator(canvas, drawingRect) {
        drawingRect.left = this.getScrollX();
        drawingRect.top = this.getScrollY();
        drawingRect.right = drawingRect.left + this.mChannelLayoutWidth;
        drawingRect.bottom = drawingRect.top + this.mTimeBarHeight;

        // Background
        //mPaint.setColor(mChannelLayoutBackground);
        canvas.fillStyle = this.mChannelLayoutBackground;
        //canvas.drawRect(drawingRect, mPaint);
        canvas.fillRect(drawingRect.left, drawingRect.top, drawingRect.width, drawingRect.height);

        // Text
        //mPaint.setColor(mEventLayoutTextColor);
        canvas.fillStyle = this.mEventLayoutTextColor;
        //mPaint.setTextSize(mTimeBarTextSize);
        //mPaint.setTextAlign(Paint.Align.CENTER);
        canvas.textAlign = "center";
        //canvas.drawText(EPGUtil.getWeekdayName(mTimeLowerBoundary),
        //drawingRect.left + ((drawingRect.right - drawingRect.left) / 2),
        //drawingRect.top + (((drawingRect.bottom - drawingRect.top) / 2) + (mTimeBarTextSize / 2)), mPaint);
        canvas.font = "bold " + this.mTimeBarTextSize + "px Arial";
        canvas.fillText(this.epgUtils.getWeekdayName(this.mTimeLowerBoundary),
            drawingRect.left + ((drawingRect.right - drawingRect.left) / 2),
            drawingRect.top + (((drawingRect.bottom - drawingRect.top) / 2) + (this.mTimeBarTextSize / 2))
        );

        //mPaint.setTextAlign(Paint.Align.LEFT);
        canvas.textAlign = "left";
    }

    drawTimebarBottomStroke(canvas, drawingRect) {
        drawingRect.left = this.getScrollX();
        drawingRect.top = this.getScrollY() + this.mTimeBarHeight;
        drawingRect.right = drawingRect.left + this.getWidth();
        drawingRect.bottom = drawingRect.top + this.mChannelLayoutMargin;

        // Bottom stroke
        //mPaint.setColor(mEPGBackground);
        canvas.fillStyle = this.mEPGBackground;
        canvas.fillRect(drawingRect.left, drawingRect.top, drawingRect.width, drawingRect.height);
    }

    drawTimeLine(canvas, drawingRect) {
        let now = this.epgUtils.getNow();

        if (this.shouldDrawPastTimeOverlay(now)) {
            // draw opaque overlay
            drawingRect.left = this.getScrollX() + this.mChannelLayoutWidth + this.mChannelLayoutMargin;
            drawingRect.top = this.getScrollY();
            drawingRect.right = this.getXFrom(now);
            drawingRect.bottom = drawingRect.top + this.getChannelListHeight();

            canvas.fillStyle = this.mTimeBarLineColor;
            let currentAlpha = canvas.globalAlpha;
            canvas.globalAlpha = 0.2;
            canvas.fillRect(drawingRect.left, drawingRect.top, drawingRect.width, drawingRect.height);
            canvas.globalAlpha = currentAlpha;
        }

        if (this.shouldDrawTimeLine(now)) {
            drawingRect.left = this.getXFrom(now);
            drawingRect.top = this.getScrollY();
            drawingRect.right = drawingRect.left + this.mTimeBarLineWidth;
            drawingRect.bottom = drawingRect.top + this.getChannelListHeight();

            //mPaint.setColor(mTimeBarLineColor);
            canvas.fillStyle = this.mTimeBarLineColor;
            //canvas.drawRect(drawingRect, mPaint);
            canvas.fillRect(drawingRect.left, drawingRect.top, drawingRect.width, drawingRect.height);
        }

    }

    drawEvents(canvas, drawingRect) {
        let firstPos = this.getFirstVisibleChannelPosition();
        let lastPos = this.getLastVisibleChannelPosition();

        //console.log("Event: First: " + firstPos + " Last: " + lastPos);

        for (let pos = firstPos; pos < lastPos; pos++) {
            // Set clip rectangle
            this.mClipRect.left = this.getScrollX() + this.mChannelLayoutWidth + this.mChannelLayoutMargin;
            this.mClipRect.top = this.getTopFrom(pos);
            this.mClipRect.right = this.getScrollX() + this.getWidth();
            this.mClipRect.bottom = this.mClipRect.top + this.mChannelLayoutHeight;

            //canvas.save();
            //canvas.rect(this.mClipRect.left, this.mClipRect.top, this.mClipRect.width, this.mClipRect.height);
            //canvas.clip();

            // Draw each event
            let foundFirst = false;
            let epgEvents = this.epgData.getEvents(pos);

            // TODO improve performance - checek if for loop can be avoided
            // hoever the list is ordered by time so its only a few events processed 
            for (let event of epgEvents) {
                if (this.isEventVisible(event.getStart(), event.getEnd())) {
                    this.drawEvent(canvas, pos, event, drawingRect);
                    if (foundFirst === false) {
                        // draw filling rect from start of event screen
                        if (event.getStart() > this.mTimeLowerBoundary) {
                            let fillRect = drawingRect.clone();
                            this.setEventDrawingRectangle(pos, this.mTimeLowerBoundary, event.getStart(), fillRect);
                            canvas.fillStyle = this.mEventLayoutBackground;
                            canvas.fillRect(fillRect.left - this.mChannelLayoutMargin, fillRect.top, fillRect.width + this.mChannelLayoutMargin, fillRect.height);
                        }
                        foundFirst = true;
                    }
                } else if (foundFirst) {
                    // painted all visible events - now we break
                    break;
                }
            }

            //canvas.restore();
        }

    }

    drawEvent(canvas, channelPosition, event, drawingRect) {

        this.setEventDrawingRectangle(channelPosition, event.getStart(), event.getEnd(), drawingRect);

        // Background
        //mPaint.setColor(event.isCurrent() ? mEventLayoutBackgroundCurrent : mEventLayoutBackground);
        canvas.fillStyle = event.isCurrent() ? this.mEventLayoutBackgroundCurrent : this.mEventLayoutBackground;
        if (channelPosition === this.getFocusedChannelPosition()) {
            let focusedEventPosition = this.getFocusedEventPosition();
            if (focusedEventPosition !== -1) {
                let focusedEvent = this.epgData.getEvent(channelPosition, focusedEventPosition);
                if (focusedEvent === event) {
                    canvas.fillStyle = this.mEventLayoutBackgroundFocus;
                }

            } else if (event.isCurrent()) {
                this.focusedEventPosition = this.epgData.getEventPosition(channelPosition, event);
                canvas.fillStyle = this.mEventLayoutBackgroundFocus
            }
        }
        //canvas.drawRect(drawingRect, mPaint);
        // if Clip is not working properly, hack
        if (drawingRect.left < this.getScrollX() + this.mChannelLayoutWidth + this.mChannelLayoutMargin) {
            drawingRect.left = this.getScrollX() + this.mChannelLayoutWidth + this.mChannelLayoutMargin;
        }
        canvas.fillRect(drawingRect.left, drawingRect.top, drawingRect.width, drawingRect.height);

        if (this.epgData.isRecording(event)) {
            canvas.fillStyle = this.mEventLayoutRecordingColor;
            canvas.fillRect(drawingRect.left, drawingRect.top, drawingRect.width, 7);
        }

        // Add left and right inner padding
        drawingRect.left += this.mChannelLayoutPadding;
        drawingRect.right -= this.mChannelLayoutPadding;

        // Text
        //mPaint.setColor(mEventLayoutTextColor);
        canvas.fillStyle = this.mEventLayoutTextColor;
        //mPaint.setTextSize(mEventLayoutTextSize);
        canvas.font = this.mEventLayoutTextSize + "px Arial";

        // Move drawing.top so text will be centered (text is drawn bottom>up)
        //mPaint.getTextBounds(event.getTitle(), 0, event.getTitle().length(), mMeasuringRect);
        drawingRect.top += (((drawingRect.bottom - drawingRect.top) / 2) + (10 / 2));

        let title = event.getTitle();
        /*title = title.substring(0,
         mPaint.breakText(title, true, drawingRect.right - drawingRect.left, null));*/
        canvas.fillText(this.getShortenedText(canvas, title, drawingRect), drawingRect.left, drawingRect.top);
        // if (event.getSubTitle()) {
        //     canvas.font = this.mEventLayoutTextSize - 6 + "px Arial";
        //     canvas.fillText(this.getShortenedText(canvas, event.getSubTitle(), drawingRect), drawingRect.left, drawingRect.top + 18);
        // }

    }

    getShortenedText(canvas, text, drawingRect) {
        let result = text;
        let maxWidth = drawingRect.right - drawingRect.left;
        for (var n = text.length; n >= 0; n--) {
            result = result.substring(0, n);
            var metrics = canvas.measureText(result);
            var testWidth = metrics.width;
            if (testWidth > maxWidth) {
                continue;
            } else {
                break;
            }
        }
        if (result.length < text.length) {
            if (result.length <= 3) {
                return "...".substring(0, result.length);
            }
            result = result.substring(0, result.length - 3) + "...";
        }
        return result;
    }

    setEventDrawingRectangle(channelPosition, start, end, drawingRect) {
        drawingRect.left = this.getXFrom(start);
        drawingRect.top = this.getTopFrom(channelPosition);
        drawingRect.right = this.getXFrom(end) - this.mChannelLayoutMargin;
        drawingRect.bottom = drawingRect.top + this.mChannelLayoutHeight;

        return drawingRect;
    }


    drawChannelListItems(canvas, drawingRect) {
        // Background
        this.mMeasuringRect.left = this.getScrollX();
        this.mMeasuringRect.top = this.getScrollY();
        this.mMeasuringRect.right = drawingRect.left + this.mChannelLayoutWidth;
        this.mMeasuringRect.bottom = this.mMeasuringRect.top + this.getChannelListHeight();

        //mPaint.setColor(mChannelLayoutBackground);
        canvas.fillStyle = this.mChannelLayoutBackground;
        canvas.fillRect(this.mMeasuringRect.left, this.mMeasuringRect.top, this.mMeasuringRect.width, this.mMeasuringRect.height);

        let firstPos = this.getFirstVisibleChannelPosition();
        let lastPos = this.getLastVisibleChannelPosition();

        //console.log("Channel: First: " + firstPos + " Last: " + lastPos);

        for (let pos = firstPos; pos < lastPos; pos++) {
            this.drawChannelItem(canvas, pos, drawingRect);
        }
    }

    /*
    drawChannelText(canvas, position, drawingRect) {
        drawingRect.left = this.getScrollX();
        drawingRect.top = this.getTopFrom(position);
        drawingRect.right = drawingRect.left + this.mChannelLayoutWidth;
        drawingRect.bottom = drawingRect.top + this.mChannelLayoutHeight;
 
        drawingRect.top += (((drawingRect.bottom - drawingRect.top) / 2) + (10/2));
 
        canvas.font = "bold "+this.mEventLayoutTextSize+"px Arial";
        let channelName = this.epgData.getChannel(position).getName();
        let channelNumber = this.epgData.getChannel(position).getId();
        //canvas.fillText(channelNumber, drawingRect.left, drawingRect.top);
        canvas.fillText(channelName, drawingRect.left + 20, drawingRect.top);
    }*/

    drawChannelItem(canvas, position, drawingRect) {
        drawingRect.left = this.getScrollX();
        drawingRect.top = this.getTopFrom(position);
        drawingRect.right = drawingRect.left + this.mChannelLayoutWidth;
        drawingRect.bottom = drawingRect.top + this.mChannelLayoutHeight;
        /*
                canvas.font = this.mEventLayoutTextSize + "px Arial";
                canvas.fillStyle = this.mEventLayoutTextColor;
                canvas.textAlign = 'right';
                canvas.fillText(this.epgData.getChannel(position).getChannelID(),
                     drawingRect.left + 60, drawingRect.top + this.mChannelLayoutHeight/2 + this.mEventLayoutTextSize/2 );
                canvas.textAlign = 'left';
                drawingRect.left += 75;
                canvas.fillText(this.getShortenedText(canvas, this.epgData.getChannel(position).getName(), drawingRect),
                     drawingRect.left, drawingRect.top + this.mChannelLayoutHeight/2 + this.mEventLayoutTextSize/2 );
                */
        // Loading channel image into target for
        let channel = this.epgData.getChannel(position);
        let imageURL = channel.getImageURL();
        let image = this.mChannelImageCache.get(imageURL);
        if (image !== undefined) {
            drawingRect = this.getDrawingRectForChannelImage(drawingRect, image);
            canvas.drawImage(image, drawingRect.left, drawingRect.top, drawingRect.width, drawingRect.height);
        } else {
            canvas.textAlign = 'center';
            canvas.font = "bold 17px Arial";
            canvas.fillStyle = this.mEventLayoutTextColor;
            this.wrapText(channel.getName(), canvas, drawingRect.left + (drawingRect.width /2), drawingRect.top +  (drawingRect.bottom - drawingRect.top) / 2, drawingRect.width, 20);
            //canvas.fillText(this.getShortenedText(canvas, channel.getName(), drawingRect), drawingRect.left + (drawingRect.width /2), drawingRect.top + 9+  (drawingRect.bottom - drawingRect.top) / 2);
            canvas.textAlign = 'left';
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

    drawFocusEvent(canvas, drawingRect) {

    }

    handleClick(event) {
        this.scrollX = this.getScrollX(false) + parseInt(TVGuide.TIME_LABEL_SPACING_MILLIS / this.mMillisPerPixel);
        //this.scroller.scrollTo(this.scrollX, this.scrollY);
        //window.scrollTo(this.scrollX, this.scrollY);


        //this.ctx.fillStyle = 'red';
        this.ctx.clearRect(0, 0, this.getWidth(), this.getChannelListHeight());
        this.clear();
        this.onDraw(this.ctx);
        //this.updateCanvas();
    }

    clear() {
        this.mClipRect = new Rect();
        this.mDrawingRect = new Rect();
        this.mMeasuringRect = new Rect();
    }

    recalculateAndRedraw(withAnimation) {
        if (this.epgData !== null && this.epgData.hasData()) {
            this.resetBoundaries();

            this.calculateMaxVerticalScroll();
            this.calculateMaxHorizontalScroll();

            this.scrollX = this.getScrollX() + this.getXPositionStart() - this.getScrollX();
            this.scrollY = this.scrollToChannelPosition(this.focusedChannelPosition, withAnimation);
            this.scroller = document.getElementsByClassName("programguide-contents")[0];
        }
    }

    handleScroll() {
        console.log("scrolling...");
    }

    handleKeyPress(event) {
        let keyCode = event.keyCode;
        let programPosition = this.getFocusedEventPosition();
        let channelPosition = this.getFocusedChannelPosition();
        let dx = 0,
            dy = 0;
        switch (keyCode) {
            case 39: // left arrow
                //let programPosition = this.getProgramPosition(this.getFocusedChannelPosition(), this.getTimeFrom(this.getScrollX(false) ));
                programPosition += 1
                if (programPosition !== -1 && programPosition < this.epgData.getEventCount(this.getFocusedChannelPosition())) {
                    this.focusedEvent = this.epgData.getEvent(this.getFocusedChannelPosition(), programPosition);
                    if (this.focusedEvent) {
                        this.focusedEventPosition = programPosition;
                        dx = parseInt((this.focusedEvent.getEnd() - this.focusedEvent.getStart()) / this.mMillisPerPixel);
                    }
                }
                this.scrollX = this.getScrollX(false) + dx;
                break;
            case 37: // right arrow
                programPosition -= 1;
                if (programPosition !== -1 && programPosition > -1) {
                    this.focusedEvent = this.epgData.getEvent(this.getFocusedChannelPosition(), programPosition);
                    if (this.focusedEvent) {
                        this.focusedEventPosition = programPosition;
                        dx = (-1) * parseInt((this.focusedEvent.getEnd() - this.focusedEvent.getStart()) / this.mMillisPerPixel);
                    }
                }
                this.scrollX = this.getScrollX(false) + dx;
                break;
            case 40: // arrow down
                // do not pass this key to the browser
                event.preventDefault();
                if (channelPosition === this.epgData.getChannelCount() - 1) {
                    return;
                }
                channelPosition += 1;
                this.scrollToChannelPosition(channelPosition, true);
                return;
            case 38: // arrow up
                // do not pass this key to the browser
                event.preventDefault();
                if (channelPosition === 0) {
                    return
                }
                channelPosition -= 1;
                this.scrollToChannelPosition(channelPosition, true);
                return;
            case 403: // red button to trigger or cancel recording
                // get current event
                this.focusedEvent = this.epgData.getEvent(channelPosition, programPosition);
                if (this.focusedEvent.isPastDated(this.epgUtils.getNow())) {
                    // past dated do nothing
                    return;
                }
                // check if event is already marked for recording
                let recEvent = this.epgData.getRecording(this.focusedEvent);
                if (recEvent) {
                    // cancel recording
                    this.tvhDataService.cancelRec(recEvent, recordings => {
                        this.epgData.updateRecordings(recordings);
                        this.updateCanvas();
                    });
                } else { // creat new recording from event
                    this.tvhDataService.createRec(this.focusedEvent, recordings => {
                        this.epgData.updateRecordings(recordings);
                        this.updateCanvas();
                    });
                }
                break;
            case 461: // back button
                // do not pass this key to the browser/webos
                event.preventDefault();
            case 404: // green or back button hide epg/show tv
            case 71: // keyboard 'g'  
                //this.refs.epg.style.display = 'none';
                this.showTvHandler();
                break;
            case 13: // ok button -> switch to focused channel
                //this.refs.epg.style.display = 'none';
                this.showTvHandler(channelPosition);
                break;
            default:
                console.log("EPG-keyPressed:", keyCode);
        }

        if (this.ctx) {
            this.ctx.clearRect(0, 0, this.getWidth(), this.getHeight());
            this.clear();
            this.onDraw(this.ctx);
        } else {
            this.clear();
        }
    }

    scrollToChannelPosition(channelPosition, withAnimation) {
        this.focusedChannelPosition = channelPosition;
        // start scrolling after padding position top
        if (channelPosition < TVGuide.VERTICAL_SCROLL_TOP_PADDING_ITEM) {
            this.scrollY = 0;
            this.updateCanvas();
            return;
        }

        // stop scrolling before padding position bottom
        if (channelPosition >= this.epgData.getChannelCount() - 1 - TVGuide.VERTICAL_SCROLL_TOP_PADDING_ITEM) {
            this.updateCanvas();
            return;
        }

        // scroll to channel position
        let scrollTarget = (this.mChannelLayoutMargin + this.mChannelLayoutHeight) * (channelPosition - TVGuide.VERTICAL_SCROLL_TOP_PADDING_ITEM);  
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

    componentDidMount() {
        //this.updateCanvas();
        this.recalculateAndRedraw(false);
        this.focusEPG();
    }

    componentDidUpdate() {
        //this.updateCanvas();
    }

    updateCanvas() {
        this.ctx = this.refs.canvas.getContext('2d');
        // draw children “components”
        this.onDraw(this.ctx)
    }

    focusEPG() {
        ReactDOM.findDOMNode(this.refs.epg).focus();
    }

    render() {
        window.addEventListener("scroll", function (event) {
        }, false);
        return (
            <div id="epg-wrapper" ref="epg" tabIndex='-1' onKeyDown={this.handleKeyPress} className="epg">
                <div className="programguide-contents">
                    <canvas
                        ref="canvas"
                        width={this.getWidth()}
                        height={this.getHeight()}
                        style={{ border: '0px solid' }} />
                </div>
            </div>

        );
    }
}