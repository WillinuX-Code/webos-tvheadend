/**
 * Created by satadru on 3/31/17.
 */
import React, { Component } from 'react';

import Rect from '../models/Rect';
import EPGUtils from '../utils/EPGUtils';
import TVHDataService from '../services/TVHDataService';
import CanvasUtils from '../utils/CanvasUtils';
import TVHSettings from './TVHSettings';
import EPGData from '../models/EPGData';
import EPGEvent from '../models/EPGEvent';
import '../styles/app.css';
import { StateUpdateHandler } from './TV';

export default class TVGuide extends Component {
    static DAYS_BACK_MILLIS = 2 * 60 * 60 * 1000; // 2 hours
    static DAYS_FORWARD_MILLIS = 1 * 24 * 60 * 60 * 1000; // 1 days
    static HOURS_IN_VIEWPORT_MILLIS = 2 * 60 * 60 * 1000; // 2 hours
    static TIME_LABEL_SPACING_MILLIS = 30 * 60 * 1000; // 30 minutes

    static VISIBLE_CHANNEL_COUNT = 8; // No of channel to show at a time
    static VERTICAL_SCROLL_BOTTOM_PADDING_ITEM = TVGuide.VISIBLE_CHANNEL_COUNT / 2 - 1;
    static VERTICAL_SCROLL_TOP_PADDING_ITEM = TVGuide.VISIBLE_CHANNEL_COUNT / 2 - 1;

    private canvas: React.RefObject<HTMLCanvasElement>;
    private epgWrapper: React.RefObject<HTMLDivElement>;

    private ctx?: CanvasRenderingContext2D | null;
    private stateUpdateHandler: StateUpdateHandler;
    private epgData: EPGData;
    private epgUtils: EPGUtils;
    private canvasUtils: CanvasUtils;
    private tvhDataService: TVHDataService;
    private scrollX: number;
    private scrollY: number;
    private timePosition: number;
    private focusedChannelPosition: number;
    private focusedEventPosition: number;
    private focusedEvent?: EPGEvent;

    private mChannelImageCache: Map<URL, HTMLImageElement>;
    private mClipRect = new Rect();
    private mDrawingRect = new Rect();
    private mMeasuringRect = new Rect();

    private mEPGBackground = '#1e1e1e';
    private mChannelLayoutMargin = 3;
    private mChannelLayoutPadding = 10;
    private mChannelLayoutHeight = 75;
    private mChannelLayoutWidth = 120;
    private mChannelLayoutBackground = '#323232';

    private mEventLayoutBackground = '#234054';
    private mEventLayoutBackgroundCurrent = '#234054';
    private mEventLayoutBackgroundFocus = 'rgb(65,182,230)';
    private mEventLayoutTextColor = '#d6d6d6';
    private mEventLayoutTextSize = 28;
    private mEventLayoutRecordingColor = '#da0000';

    private mDetailsLayoutMargin = 5;
    private mDetailsLayoutPadding = 8;
    private mDetailsLayoutTextColor = '#d6d6d6';
    private mDetailsLayoutTitleTextSize = 30;
    private mDetailsLayoutSubTitleTextSize = 26;
    private mDetailsLayoutSubTitleTextColor = '#969696';
    private mDetailsLayoutDescriptionTextSize = 28;
    private mDetailsLayoutBackground = '#2d71ac';

    private mTimeBarHeight = 70;
    private mTimeBarTextSize = 32;
    private mTimeBarNowTextSize = 22;
    private mTimeBarLineWidth = 3;
    private mTimeBarLineColor = '#c57120';
    private mTimeBarLinePositionColor = 'rgb(65,182,230)';
    private mResetButtonSize = 40;
    private mResetButtonMargin = 10;

    private mMillisPerPixel = 0;
    private mTimeOffset = 0;
    private mTimeLowerBoundary = 0;
    private mTimeUpperBoundary = 0;
    private mMaxHorizontalScroll = 0;
    private mMaxVerticalScroll = 0;

    private scrollAnimationId?: number;
    private scroller?: Element;

    constructor(public props: Readonly<any>) {
        super(props);

        this.canvas = React.createRef();
        this.epgWrapper = React.createRef();
        this.stateUpdateHandler = this.props.stateUpdateHandler;
        this.epgData = this.props.epgData;
        this.epgUtils = new EPGUtils();
        this.canvasUtils = new CanvasUtils();
        // read settings from storage
        const tvhSettings = JSON.parse(localStorage.getItem(TVHSettings.STORAGE_TVH_SETTING_KEY) || '');
        this.tvhDataService = new TVHDataService(tvhSettings);
        this.scrollX = 0;
        this.scrollY = 0;
        this.timePosition = this.epgUtils.getNow();
        this.focusedChannelPosition = this.props.channelPosition;
        this.focusedEventPosition = -1;

        this.mChannelImageCache = this.props.imageCache;
    }

    resetBoundaries() {
        this.mMillisPerPixel = this.calculateMillisPerPixel();
        this.mTimeOffset = this.calculatedBaseLine();
        this.mTimeLowerBoundary = this.getTimeFrom(0);
        this.mTimeUpperBoundary = this.getTimeFrom(this.getWidth());
    }

    calculateMaxHorizontalScroll() {
        this.mMaxHorizontalScroll = Math.floor(
            (TVGuide.DAYS_BACK_MILLIS + TVGuide.DAYS_FORWARD_MILLIS - TVGuide.HOURS_IN_VIEWPORT_MILLIS) /
                this.mMillisPerPixel
        );
    }

    calculateMaxVerticalScroll() {
        const maxVerticalScroll = this.getTopFrom(this.epgData.getChannelCount() - 1) + this.mChannelLayoutHeight;
        this.mMaxVerticalScroll =
            maxVerticalScroll < this.getChannelListHeight() ? 0 : maxVerticalScroll - this.getChannelListHeight();
    }

    calculateMillisPerPixel() {
        return (
            TVGuide.HOURS_IN_VIEWPORT_MILLIS / (this.getWidth() - this.mChannelLayoutWidth - this.mChannelLayoutMargin)
        );
    }

    calculatedBaseLine() {
        //return LocalDateTime.now().toDateTime().minusMillis(DAYS_BACK_MILLIS).getMillis();
        return this.epgUtils.getNow() - TVGuide.DAYS_BACK_MILLIS;
    }

    getProgramPosition(channelPosition: number, time: number) {
        const events = this.epgData.getEvents(channelPosition);
        if (events !== null) {
            for (let eventPos = 0; eventPos < events.length; eventPos++) {
                const event = events[eventPos];
                if (event.getStart() <= time && event.getEnd() >= time) {
                    return eventPos;
                }
            }
        }
        return -1;
    }

    getFirstVisibleChannelPosition() {
        const y = this.getScrollY(false);

        let position =
            Math.round(
                (y - this.mChannelLayoutMargin - this.mTimeBarHeight) /
                    (this.mChannelLayoutHeight + this.mChannelLayoutMargin)
            ) + 1;

        if (position < 0) {
            position = 0;
        }

        return position;
    }

    getLastVisibleChannelPosition() {
        const y = this.getScrollY(false);
        const screenHeight = this.getChannelListHeight();
        const position = Math.floor(
            (y + screenHeight - this.mTimeBarHeight - this.mChannelLayoutMargin) /
                (this.mChannelLayoutHeight + this.mChannelLayoutMargin)
        );

        return position + 1;
    }

    getXFrom(time: number) {
        return Math.floor(
            (time - this.mTimeLowerBoundary) / this.mMillisPerPixel +
                this.mChannelLayoutMargin +
                this.mChannelLayoutWidth +
                this.mChannelLayoutMargin
        );
    }

    getTopFrom(position: number) {
        const y =
            position * (this.mChannelLayoutHeight + this.mChannelLayoutMargin) +
            this.mChannelLayoutMargin +
            this.mTimeBarHeight;
        return y - this.getScrollY(false);
    }

    getXPositionStart() {
        return this.getXFrom(this.epgUtils.getNow() - TVGuide.HOURS_IN_VIEWPORT_MILLIS / 2);
    }

    getTimeFrom(x: number) {
        return x * this.mMillisPerPixel + this.mTimeOffset;
    }

    shouldDrawTimeLine(now: number) {
        return now >= this.mTimeLowerBoundary && now < this.mTimeUpperBoundary;
    }

    shouldDrawPastTimeOverlay(now: number) {
        return now >= this.mTimeLowerBoundary;
    }

    isEventVisible(start: number, end: number) {
        return (
            (start >= this.mTimeLowerBoundary && start <= this.mTimeUpperBoundary) ||
            (end >= this.mTimeLowerBoundary && end <= this.mTimeUpperBoundary) ||
            (start <= this.mTimeLowerBoundary && end >= this.mTimeUpperBoundary)
        );
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
        return (
            this.mTimeBarHeight +
            (this.mChannelLayoutMargin + this.mChannelLayoutHeight) * TVGuide.VISIBLE_CHANNEL_COUNT
        );
    }

    onDraw(canvas: CanvasRenderingContext2D) {
        if (this.epgData?.hasData()) {
            this.mTimeLowerBoundary = this.getTimeFrom(this.getScrollX(false));
            this.mTimeUpperBoundary = this.getTimeFrom(this.getScrollX(false) + this.getWidth());
            const drawingRect = this.mDrawingRect;
            //console.log("X:" + this.getScrollX());
            drawingRect.left = this.getScrollX();
            drawingRect.top = this.getScrollY();
            drawingRect.right = drawingRect.left + this.getWidth();
            drawingRect.bottom = drawingRect.top + this.getHeight();
            // clear rect
            //canvas.clearRect(0, 0, this.getWidth(), this.getChannelListHeight());
            // draw background
            // canvas.fillStyle = '#000000';
            // canvas.fillRect(drawingRect.left, drawingRect.top, drawingRect.width, drawingRect.height);
            this.drawBackground(canvas, drawingRect);
            this.drawChannelListItems(canvas, drawingRect);
            this.drawEvents(canvas, drawingRect);
            this.drawTimebar(canvas, drawingRect);
            //drawResetButton(canvas, drawingRect);
            this.drawTimeLine(canvas, drawingRect);
            // draw details pane
            this.drawDetails(canvas, drawingRect);
        }
    }

    /**
     * draw background and usee cache for future
     *
     * @param canvas
     * @param drawingRect
     */
    async drawBackground(canvas: CanvasRenderingContext2D, drawingRect: Rect) {
        drawingRect.left = this.getScrollX();
        drawingRect.top = this.getScrollY();
        drawingRect.right = drawingRect.left + this.getWidth();
        drawingRect.bottom = drawingRect.top + this.getHeight();

        canvas.fillStyle = '#000000';
        canvas.fillRect(drawingRect.left, drawingRect.top, drawingRect.width, drawingRect.height);
        // channel Background
        this.mMeasuringRect.left = this.getScrollX();
        this.mMeasuringRect.top = this.getScrollY();
        this.mMeasuringRect.right = drawingRect.left + this.mChannelLayoutWidth;
        this.mMeasuringRect.bottom = this.mMeasuringRect.top + this.getChannelListHeight();

        //mPaint.setColor(mChannelLayoutBackground);
        canvas.fillStyle = this.mChannelLayoutBackground;
        canvas.fillRect(
            this.mMeasuringRect.left,
            this.mMeasuringRect.top,
            this.mMeasuringRect.width,
            this.mMeasuringRect.height
        );

        // events Background
        drawingRect.left = this.mChannelLayoutWidth + this.mChannelLayoutMargin;
        drawingRect.top = this.mTimeBarHeight + this.mChannelLayoutMargin;
        drawingRect.right = this.getWidth();
        drawingRect.bottom = this.getChannelListHeight();
        canvas.globalAlpha = 1.0;
        // put stroke color to transparent
        //canvas.strokeStyle = "transparent";
        canvas.strokeStyle = 'gradient';
        //mPaint.setColor(mChannelLayoutBackground);
        // canvas.fillStyle = this.mChannelLayoutBackground;
        // Create gradient
        const grd = canvas.createLinearGradient(
            drawingRect.left,
            drawingRect.left,
            drawingRect.right,
            drawingRect.left
        );
        // Important bit here is to use rgba()
        grd.addColorStop(0, 'rgba(35, 64, 84, 0.4)');
        grd.addColorStop(0.3, 'rgba(35, 64, 84, 0.9)');
        grd.addColorStop(0.7, 'rgba(35, 64, 84, 0.9)');
        grd.addColorStop(1, 'rgba(35, 64, 84, 0.4)');

        // Fill with gradient
        canvas.fillStyle = grd;
        canvas.fillRect(drawingRect.left, drawingRect.top, drawingRect.width, drawingRect.height);

        // draw vertical line
        canvas.beginPath();
        canvas.lineWidth = 0.5;
        canvas.strokeStyle = this.mEventLayoutTextColor;
        canvas.moveTo(drawingRect.left, drawingRect.top);
        canvas.lineTo(drawingRect.left, drawingRect.bottom);
        canvas.stroke();

        // timebar
        drawingRect.left = this.getScrollX() + this.mChannelLayoutWidth + this.mChannelLayoutMargin;
        drawingRect.top = this.getScrollY();
        drawingRect.right = drawingRect.left + this.getWidth();
        drawingRect.bottom = drawingRect.top + this.mTimeBarHeight;

        // Background
        canvas.fillStyle = this.mChannelLayoutBackground;
        canvas.fillRect(drawingRect.left, drawingRect.top, drawingRect.width, drawingRect.height);
    }

    drawDetails(canvas: CanvasRenderingContext2D, drawingRect: Rect) {
        // Background
        drawingRect.left = this.getScrollX();
        drawingRect.top = this.getChannelListHeight();
        drawingRect.right = this.getWidth();
        drawingRect.bottom = this.getHeight();

        canvas.fillStyle = '#000000'; //this.mChannelLayoutBackground'';
        canvas.fillRect(drawingRect.left, drawingRect.top, drawingRect.width, drawingRect.height);

        // rect for logo
        drawingRect.left = this.getScrollX();
        drawingRect.top = this.getChannelListHeight();
        drawingRect.right = drawingRect.left + 300;
        drawingRect.bottom = this.getHeight();

        const channel = this.epgData.getChannel(this.getFocusedChannelPosition());
        const event = this.epgData.getEvent(this.getFocusedChannelPosition(), this.getFocusedEventPosition());
        const imageURL = channel?.getImageURL();
        const image = imageURL && this.mChannelImageCache.get(imageURL);
        if (image) {
            const imageDrawingRect = this.getDrawingRectForChannelImage(drawingRect, image);
            canvas.drawImage(
                image,
                imageDrawingRect.left,
                imageDrawingRect.top,
                imageDrawingRect.width,
                drawingRect.height
            );
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
            // draw title, description etc
            this.canvasUtils.writeText(canvas, event.getTitle(), drawingRect.left, drawingRect.top, {
                fontSize: this.mDetailsLayoutTitleTextSize,
                isBold: true,
                fillStyle: this.mDetailsLayoutTextColor,
            });
            if (event.getSubTitle() !== undefined) {
                this.drawDetailsSubtitle(event.getSubTitle(), canvas, drawingRect);
            }
            this.drawDetailsTimeInfo(event, canvas, drawingRect);
            if (event.getDescription() !== undefined) {
                this.drawDetailsDescription(event.getDescription(), canvas, drawingRect);
            }
        }
    }

    drawDetailsDescription(description: string, canvas: CanvasRenderingContext2D, drawingRect: Rect) {
        const drect = drawingRect.clone();
        drect.right = this.getWidth() - 10;
        drect.top += (this.mDetailsLayoutTitleTextSize + this.mDetailsLayoutPadding) * 2 + 3;
        // draw title, description etc
        canvas.font = this.mDetailsLayoutDescriptionTextSize + 'px Arial';
        canvas.fillStyle = this.mDetailsLayoutTextColor;
        this.canvasUtils.wrapText(
            canvas,
            description,
            drect.left,
            drect.top,
            drect.width,
            this.mDetailsLayoutTitleTextSize + 5
        );
    }

    drawDetailsTimeInfo(event: EPGEvent, canvas: CanvasRenderingContext2D, drawingRect: Rect) {
        const tDrawingRect = drawingRect.clone();
        tDrawingRect.right = this.getWidth() - 10;
        const timeFrameText = this.epgUtils.toTimeFrameString(event.getStart(), event.getEnd(), this.context.locale);
        this.canvasUtils.writeText(canvas, timeFrameText, tDrawingRect.right, tDrawingRect.top, {
            fontSize: this.mDetailsLayoutTitleTextSize,
            textAlign: 'right',
            isBold: true,
        });
    }

    drawDetailsSubtitle(subtitle: string, canvas: CanvasRenderingContext2D, drawingRect: Rect) {
        const drect = drawingRect.clone();
        drect.top += this.mDetailsLayoutTitleTextSize + this.mDetailsLayoutPadding;
        this.canvasUtils.writeText(canvas, subtitle, drect.left, drect.top, {
            fontSize: this.mDetailsLayoutSubTitleTextSize,
            fillStyle: this.mDetailsLayoutSubTitleTextColor,
            isBold: true,
            maxWidth: drect.width,
        });
    }

    drawTimebar(canvas: CanvasRenderingContext2D, drawingRect: Rect) {
        drawingRect.left = this.getScrollX() + this.mChannelLayoutWidth + this.mChannelLayoutMargin;
        drawingRect.top = this.getScrollY();
        drawingRect.right = drawingRect.left + this.getWidth();
        drawingRect.bottom = drawingRect.top + this.mTimeBarHeight;
        // draw time stamps
        for (let i = 0; i < TVGuide.HOURS_IN_VIEWPORT_MILLIS / TVGuide.TIME_LABEL_SPACING_MILLIS; i++) {
            // Get time and round to nearest half hour
            let time =
                TVGuide.TIME_LABEL_SPACING_MILLIS *
                ((this.mTimeLowerBoundary +
                    TVGuide.TIME_LABEL_SPACING_MILLIS * i +
                    TVGuide.TIME_LABEL_SPACING_MILLIS / 2) /
                    TVGuide.TIME_LABEL_SPACING_MILLIS);
            time = this.epgUtils.getRoundedDate(30, new Date(time)).getTime();

            const timeText = this.epgUtils.toTimeString(time, this.context.locale);
            const x = this.getXFrom(time);
            const y = drawingRect.middle;
            this.canvasUtils.writeText(canvas, timeText, x, y, {
                fontSize: this.mEventLayoutTextSize,
                fillStyle: this.mEventLayoutTextColor,
                textAlign: 'center',
                isBold: true,
            });
        }

        this.drawTimebarDayIndicator(canvas, drawingRect);
        this.drawTimebarBottomStroke(canvas, drawingRect);
    }

    drawTimebarDayIndicator(canvas: CanvasRenderingContext2D, drawingRect: Rect) {
        drawingRect.left = this.getScrollX();
        drawingRect.top = this.getScrollY();
        drawingRect.right = drawingRect.left + this.mChannelLayoutWidth;
        drawingRect.bottom = drawingRect.top + this.mTimeBarHeight;

        // Background
        canvas.fillStyle = this.mChannelLayoutBackground;
        canvas.fillRect(drawingRect.left, drawingRect.top, drawingRect.width, drawingRect.height);

        // Text
        const weekdayText = this.epgUtils.getWeekdayName(this.mTimeLowerBoundary, this.context.locale);
        this.canvasUtils.writeText(canvas, weekdayText, drawingRect.center, drawingRect.middle, {
            fontSize: this.mTimeBarTextSize,
            fillStyle: this.mEventLayoutTextColor,
            textAlign: 'center',
            isBold: true,
        });
    }

    drawTimebarBottomStroke(canvas: CanvasRenderingContext2D, drawingRect: Rect) {
        drawingRect.left = this.getScrollX();
        drawingRect.top = this.getScrollY() + this.mTimeBarHeight;
        drawingRect.right = drawingRect.left + this.getWidth();
        drawingRect.bottom = drawingRect.top + this.mChannelLayoutMargin;

        // Bottom stroke
        //mPaint.setColor(mEPGBackground);
        canvas.fillStyle = this.mEPGBackground;
        canvas.fillRect(drawingRect.left, drawingRect.top, drawingRect.width, drawingRect.height);
    }

    drawTimeLine(canvas: CanvasRenderingContext2D, drawingRect: Rect) {
        const now = this.epgUtils.getNow();

        if (this.shouldDrawPastTimeOverlay(now)) {
            // draw opaque overlay
            drawingRect.left = this.getScrollX() + this.mChannelLayoutWidth + this.mChannelLayoutMargin;
            drawingRect.top = this.getScrollY();
            drawingRect.right = this.getXFrom(now);
            drawingRect.bottom = drawingRect.top + this.getChannelListHeight();

            canvas.fillStyle = this.mTimeBarLineColor;
            const currentAlpha = canvas.globalAlpha;
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

        // draw current position
        drawingRect.left = this.getXFrom(this.timePosition);
        drawingRect.top = this.getScrollY() + this.mTimeBarHeight - this.mTimeBarTextSize + 10;
        drawingRect.right = drawingRect.left + this.mTimeBarLineWidth;
        drawingRect.bottom = drawingRect.top + this.getChannelListHeight();

        // draw now time stroke
        canvas.fillStyle = this.mTimeBarLinePositionColor;
        canvas.fillRect(drawingRect.left, drawingRect.top, drawingRect.width, drawingRect.height);
        // draw now time text
        drawingRect.top += this.mTimeBarNowTextSize / 2;
        drawingRect.left = this.getXFrom(this.timePosition) + this.mChannelLayoutPadding;
        const timeText = this.epgUtils.toTimeString(this.timePosition, this.context.locale);
        this.canvasUtils.writeText(canvas, timeText, drawingRect.left, drawingRect.top, {
            fontSize: this.mTimeBarNowTextSize,
            fillStyle: this.mTimeBarLinePositionColor,
            isBold: true,
        });
    }

    drawEvents(canvas: CanvasRenderingContext2D, drawingRect: Rect) {
        // Background
        drawingRect.left = this.mChannelLayoutWidth + this.mChannelLayoutMargin;
        drawingRect.top = this.mTimeBarHeight + this.mChannelLayoutMargin;
        drawingRect.right = this.getWidth();
        drawingRect.bottom = this.getChannelListHeight();

        const firstPos = this.getFirstVisibleChannelPosition();
        const lastPos = this.getLastVisibleChannelPosition();

        //console.log("Channel: First: " + firstPos + " Last: " + lastPos);
        //let transparentTop = firstPos + 3;
        //let transparentBottom = lastPos - 3;
        // canvas.globalAlpha = 0.0;
        for (let pos = firstPos; pos < lastPos; pos++) {
            // if (pos <= transparentTop) {
            //     canvas.globalAlpha += 0.25;
            // } else if (pos >= transparentBottom) {
            //     canvas.globalAlpha -= 0.25;
            // } else {
            //     canvas.globalAlpha = 1;
            // }
            // draw horizontal lines
            canvas.beginPath();
            canvas.lineWidth = 0.5;
            canvas.strokeStyle = this.mEventLayoutTextColor;
            canvas.moveTo(this.mChannelLayoutWidth + this.mChannelLayoutMargin, this.getTopFrom(pos));
            canvas.lineTo(this.getWidth(), this.getTopFrom(pos));
            canvas.stroke();

            const epgEvents = this.epgData.getEvents(pos);
            let wasVisible = false;
            //  the list is ordered by time so its only a few events processed
            for (const event of epgEvents) {
                const isVisible = this.isEventVisible(event.getStart(), event.getEnd());
                if (isVisible) {
                    wasVisible = true;
                    this.drawEvent(canvas, pos, event, drawingRect);
                }
                if (wasVisible && !isVisible) {
                    break;
                }
            }
        }
        canvas.globalAlpha = 1;
    }

    drawEvent(canvas: CanvasRenderingContext2D, channelPosition: number, event: EPGEvent, drawingRect: Rect) {
        this.setEventDrawingRectangle(channelPosition, event.getStart(), event.getEnd(), drawingRect);

        // Background
        //mPaint.setColor(event.isCurrent() ? mEventLayoutBackgroundCurrent : mEventLayoutBackground);
        canvas.fillStyle = event.isCurrent() ? this.mEventLayoutBackgroundCurrent : this.mEventLayoutBackground;
        const focusedEventPosition = this.getFocusedEventPosition();
        const focusedEvent = this.epgData.getEvent(channelPosition, focusedEventPosition);
        if (channelPosition === this.getFocusedChannelPosition()) {
            if (focusedEventPosition !== -1) {
                if (focusedEvent === event) {
                    canvas.fillStyle = this.mEventLayoutBackgroundFocus;
                }
            } else if (event.isCurrent()) {
                this.focusedEventPosition = this.epgData.getEventPosition(channelPosition, event) || 0;
                canvas.fillStyle = this.mEventLayoutBackgroundFocus;
            }
        }
        //canvas.drawRect(drawingRect, mPaint);
        // set starting minimal behind channel list
        if (drawingRect.left < this.getScrollX() + this.mChannelLayoutWidth + this.mChannelLayoutMargin) {
            drawingRect.left = this.getScrollX() + this.mChannelLayoutWidth + this.mChannelLayoutMargin;
        }

        if (
            event.isCurrent() ||
            event === this.epgData.getEvent(this.focusedChannelPosition, this.focusedEventPosition)
        ) {
            canvas.fillRect(drawingRect.left + 1, drawingRect.top + 1, drawingRect.width + 1, drawingRect.height + 1);
        }
        // draw vertical line
        canvas.beginPath();
        canvas.lineWidth = 0.5;
        canvas.strokeStyle = this.mEventLayoutTextColor;
        canvas.moveTo(drawingRect.left, drawingRect.top + 1);
        canvas.lineTo(drawingRect.left, drawingRect.bottom + 2);
        canvas.stroke();

        if (this.epgData.isRecording(event)) {
            canvas.fillStyle = this.mEventLayoutRecordingColor;
            canvas.fillRect(drawingRect.left, drawingRect.top, drawingRect.width, 4);
        }

        // Add left and right inner padding
        drawingRect.left += this.mChannelLayoutPadding;
        drawingRect.right -= this.mChannelLayoutPadding;

        // Text
        this.canvasUtils.writeText(canvas, event.getTitle(), drawingRect.left, drawingRect.middle, {
            fontSize: this.mEventLayoutTextSize,
            fillStyle: this.mEventLayoutTextColor,
            maxWidth: drawingRect.width,
        });
        // if (event.getSubTitle()) {
        //     canvas.font = this.mEventLayoutTextSize - 6 + "px Arial";
        //     canvas.fillText(this.canvasUtils.getShortenedText(canvas, event.getSubTitle(), drawingRect), drawingRect.left, drawingRect.top + 18);
        // }
    }

    setEventDrawingRectangle(channelPosition: number, start: number, end: number, drawingRect: Rect) {
        drawingRect.left = this.getXFrom(start);
        drawingRect.top = this.getTopFrom(channelPosition);
        drawingRect.right = this.getXFrom(end) - this.mChannelLayoutMargin;
        drawingRect.bottom = drawingRect.top + this.mChannelLayoutHeight;
        return drawingRect;
    }

    drawChannelListItems(canvas: CanvasRenderingContext2D, drawingRect: Rect) {
        // Background
        this.mMeasuringRect.left = this.getScrollX();
        this.mMeasuringRect.top = this.getScrollY();
        this.mMeasuringRect.right = drawingRect.left + this.mChannelLayoutWidth;
        this.mMeasuringRect.bottom = this.mMeasuringRect.top + this.getChannelListHeight();

        const firstPos = this.getFirstVisibleChannelPosition();
        const lastPos = this.getLastVisibleChannelPosition();

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

    drawChannelItem(canvas: CanvasRenderingContext2D, position: number, drawingRect: Rect) {
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
                canvas.fillText(this.canvasUtils.getShortenedText(canvas, this.epgData.getChannel(position).getName(), drawingRect),
                     drawingRect.left, drawingRect.top + this.mChannelLayoutHeight/2 + this.mEventLayoutTextSize/2 );
                */
        // Loading channel image into target for
        const channel = this.epgData.getChannel(position);
        const imageURL = channel?.getImageURL();
        const image = imageURL && this.mChannelImageCache.get(imageURL);
        if (image) {
            drawingRect = this.getDrawingRectForChannelImage(drawingRect, image);
            canvas.drawImage(image, drawingRect.left, drawingRect.top, drawingRect.width, drawingRect.height);
        } else {
            canvas.textAlign = 'center';
            canvas.font = 'bold 17px Arial';
            canvas.fillStyle = this.mEventLayoutTextColor;
            this.canvasUtils.wrapText(
                canvas,
                channel?.getName() || '',
                drawingRect.left + drawingRect.width / 2,
                drawingRect.top + (drawingRect.bottom - drawingRect.top) / 2,
                drawingRect.width,
                20
            );
            //canvas.fillText(this.canvasUtils.getShortenedText(canvas, channel.getName(), drawingRect), drawingRect.left + (drawingRect.width /2), drawingRect.top + 9+  (drawingRect.bottom - drawingRect.top) / 2);
            canvas.textAlign = 'left';
        }
    }

    getDrawingRectForChannelImage(drawingRect: Rect, image: HTMLImageElement) {
        drawingRect.left += this.mChannelLayoutPadding;
        drawingRect.top += this.mChannelLayoutPadding;
        drawingRect.right -= this.mChannelLayoutPadding;
        drawingRect.bottom -= this.mChannelLayoutPadding;

        const imageWidth = image.width;
        const imageHeight = image.height;
        const imageRatio = imageHeight / imageWidth;

        const rectWidth = drawingRect.right - drawingRect.left;
        const rectHeight = drawingRect.bottom - drawingRect.top;

        // Keep aspect ratio.
        if (imageWidth > imageHeight) {
            const padding = Math.floor((rectHeight - rectWidth * imageRatio) / 2);
            drawingRect.top += padding;
            drawingRect.bottom -= padding;
        } else if (imageWidth <= imageHeight) {
            const padding = Math.floor((rectWidth - rectHeight / imageRatio) / 2);
            drawingRect.left += padding;
            drawingRect.right -= padding;
        }

        return drawingRect;
    }

    handleClick = (event: any) => {
        this.scrollX = this.getScrollX(false) + Math.floor(TVGuide.TIME_LABEL_SPACING_MILLIS / this.mMillisPerPixel);
        //this.scroller.scrollTo(this.scrollX, this.scrollY);
        //window.scrollTo(this.scrollX, this.scrollY);

        if (this.ctx) {
            //this.ctx.fillStyle = 'red';
            this.ctx.clearRect(0, 0, this.getWidth(), this.getChannelListHeight());
            this.clear();
            this.onDraw(this.ctx);
            //this.updateCanvas();
        }
    };

    clear() {
        this.mClipRect = new Rect();
        this.mDrawingRect = new Rect();
        this.mMeasuringRect = new Rect();
    }

    recalculateAndRedraw(withAnimation: boolean) {
        if (this.epgData !== null && this.epgData.hasData()) {
            //this.resetBoundaries();
            this.calculateMaxVerticalScroll();
            this.calculateMaxHorizontalScroll();

            //this.scrollX = this.getScrollX() + this.getXPositionStart() - this.getScrollX();
            this.scrollToChannelPosition(this.focusedChannelPosition, withAnimation);
            this.scroller = document.getElementsByClassName('programguide-contents')[0];
        }
    }

    handleKeyPress = (event: React.KeyboardEvent<HTMLDivElement>) => {
        const keyCode = event.keyCode;
        let programPosition = this.getFocusedEventPosition();
        let channelPosition = this.getFocusedChannelPosition();

        // do not pass this event to parents
        switch (keyCode) {
            case 39: // right arrow
                event.stopPropagation();
                programPosition += 1;
                this.scrollToProgramPosition(programPosition);
                break;
            case 37: // left arrow
                event.stopPropagation();
                programPosition -= 1;
                this.scrollToProgramPosition(programPosition);
                break;
            case 40: // arrow down
                event.stopPropagation();
                channelPosition += 1;
                if (channelPosition > this.epgData.getChannelCount() - 1) {
                    channelPosition = 0;
                }
                this.scrollToChannelPosition(channelPosition, false);
                return;
            case 38: // arrow up
                event.stopPropagation();
                channelPosition -= 1;
                if (channelPosition < 0) {
                    channelPosition = this.epgData.getChannelCount() - 1;
                }
                this.scrollToChannelPosition(channelPosition, false);
                return;
            case 403:
                event.stopPropagation();
                this.toggleRecording(channelPosition, programPosition);
                break;
            case 461:
            case 406: // blue or back button hide epg/show tv
            case 66: // keyboard 'b'
                event.stopPropagation();
                this.cancelScrollAnimation();
                this.stateUpdateHandler({
                    isEpgState: false,
                });
                break;
            case 13: // ok button -> switch to focused channel
                event.stopPropagation();
                this.cancelScrollAnimation();
                this.stateUpdateHandler({
                    isEpgState: false,
                    isInfoState: true,
                    channelPosition: channelPosition,
                });
                break;
            default:
                console.log('EPG-keyPressed:', keyCode);
        }

        if (this.ctx) {
            this.ctx.clearRect(0, 0, this.getWidth(), this.getHeight());
            this.clear();
            this.onDraw(this.ctx);
        } else {
            this.clear();
        }
    };

    private toggleRecording(channelPosition: number, programPosition: number) {
        // red button to trigger or cancel recording
        // get current event
        this.focusedEvent = this.epgData.getEvent(channelPosition, programPosition);
        if (this.focusedEvent.isPastDated(this.epgUtils.getNow())) {
            // past dated do nothing
            return;
        }
        // check if event is already marked for recording
        const recEvent = this.epgData.getRecording(this.focusedEvent);
        if (recEvent) {
            // cancel recording
            this.tvhDataService.cancelRec(recEvent, (recordings: EPGEvent[]) => {
                this.epgData.updateRecordings(recordings);
                this.updateCanvas();
            });
        } else {
            // creat new recording from event
            this.tvhDataService.createRec(this.focusedEvent, (recordings: EPGEvent[]) => {
                this.epgData.updateRecordings(recordings);
                this.updateCanvas();
            });
        }
    }

    scrollToProgramPosition(programPosition: number) {
        if (programPosition < 0) {
            programPosition = 0;
        }
        const eventCount = this.epgData.getEventCount(this.getFocusedChannelPosition());
        if (programPosition >= eventCount - 1) {
            programPosition = eventCount - 1;
        }
        this.focusedEventPosition = programPosition;
        const targetEvent = this.epgData.getEvent(this.getFocusedChannelPosition(), programPosition);
        if (targetEvent) {
            this.scrollToTimePosition(targetEvent.getStart() + 1 - this.timePosition);
        }
    }

    scrollToTimePosition(timeDeltaInMillis: number) {
        const targetTimePosition = (this.timePosition += timeDeltaInMillis);
        // if (targetTimePosition < this.mTimeLowerBoundary) {
        //     this.timePosition = this.mTimeLowerBoundary;
        //     return;
        // }
        // if (targetTimePosition > this.mTimeUpperBoundary) {
        //     this.timePosition = this.mTimeUpperBoundary;
        //     return;
        // }

        this.timePosition = targetTimePosition;
        this.focusedEventPosition = this.getProgramPosition(this.focusedChannelPosition, this.timePosition);
        this.focusedEvent = this.epgData.getEvent(this.focusedChannelPosition, this.focusedEventPosition);
        if (this.focusedEvent) {
            this.resetBoundaries();
            this.scrollX = this.getXFrom(this.timePosition - TVGuide.HOURS_IN_VIEWPORT_MILLIS / 2);
        }
        this.updateCanvas();
    }

    scrollToChannelPosition(channelPosition: number, withAnimation: boolean) {
        this.focusedChannelPosition = channelPosition;
        this.scrollToTimePosition(0);
        // start scrolling after padding position top
        if (channelPosition < TVGuide.VERTICAL_SCROLL_TOP_PADDING_ITEM) {
            this.scrollY = 0;
            this.updateCanvas();
            return;
        }

        // stop scrolling before padding position bottom
        const maxPosition = this.epgData.getChannelCount() - 1 - TVGuide.VERTICAL_SCROLL_TOP_PADDING_ITEM;
        if (channelPosition >= maxPosition) {
            // fix scroll to channel in case it is within bottom padding
            if (this.scrollY === 0) {
                this.scrollY =
                    this.mChannelLayoutMargin * TVGuide.VISIBLE_CHANNEL_COUNT -
                    1 +
                    this.mChannelLayoutHeight * (maxPosition - TVGuide.VERTICAL_SCROLL_TOP_PADDING_ITEM);
            }
            this.updateCanvas();
            return;
        }

        // scroll to channel position
        const scrollTarget =
            (this.mChannelLayoutMargin + this.mChannelLayoutHeight) *
            (channelPosition - TVGuide.VERTICAL_SCROLL_TOP_PADDING_ITEM);
        if (!withAnimation) {
            this.scrollY = scrollTarget;
            this.updateCanvas();
            return;
        }

        const scrollDistance = scrollTarget - this.scrollY;
        const scrollDelta = scrollDistance / (this.mChannelLayoutHeight / 5);
        this.cancelScrollAnimation();
        this.scrollAnimationId = requestAnimationFrame(() => {
            this.animateScroll(scrollDelta, scrollTarget);
        });
        //console.log("Scrolled to y=%d, position=%d", this.scrollY, this.channelPosition);
        //this.updateCanvas();
    }

    cancelScrollAnimation() {
        this.scrollAnimationId && cancelAnimationFrame(this.scrollAnimationId);
    }

    animateScroll(scrollDelta: number, scrollTarget: number) {
        if (scrollDelta < 0 && this.scrollY <= scrollTarget) {
            //this.scrollY = scrollTarget;
            this.cancelScrollAnimation();
            return;
        }
        if (scrollDelta > 0 && this.scrollY >= scrollTarget) {
            //this.scrollY = scrollTarget;
            this.cancelScrollAnimation();
            return;
        }
        //console.log("scrolldelta=%d, scrolltarget=%d, scrollY=%d", scrollDelta, scrollTarget, this.scrollY);
        this.scrollY += scrollDelta;
        this.updateCanvas();
        this.scrollAnimationId = requestAnimationFrame(() => {
            this.animateScroll(scrollDelta, scrollTarget);
        });
    }

    componentDidMount() {
        //this.updateCanvas();
        //this.resetBoundaries();
        this.recalculateAndRedraw(false);
        this.focusEPG();
    }

    componentDidUpdate() {
        //this.updateCanvas();
    }

    updateCanvas() {
        if (this.canvas.current) {
            this.ctx = this.canvas.current.getContext('2d');

            // draw child elements
            this.ctx && this.onDraw(this.ctx);
        }
    }

    focusEPG() {
        this.epgWrapper.current?.focus();
    }

    render() {
        return (
            <div id="epg-wrapper" ref={this.epgWrapper} tabIndex={-1} onKeyDown={this.handleKeyPress} className="epg">
                <div className="programguide-contents">
                    <canvas
                        ref={this.canvas}
                        width={this.getWidth()}
                        height={this.getHeight()}
                        style={{ display: 'block' }}
                    />
                </div>
            </div>
        );
    }
}
