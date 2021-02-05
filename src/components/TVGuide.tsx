/**
 * Created by satadru on 3/31/17.
 */
import React, { useContext, useEffect, useRef } from 'react';

import Rect from '../models/Rect';
import EPGUtils from '../utils/EPGUtils';
import CanvasUtils from '../utils/CanvasUtils';
import EPGEvent from '../models/EPGEvent';
import AppContext from '../AppContext';
import '../styles/app.css';

const DAYS_BACK_MILLIS = 2 * 60 * 60 * 1000; // 2 hours
// const DAYS_FORWARD_MILLIS = 1 * 24 * 60 * 60 * 1000; // 1 days
const HOURS_IN_VIEWPORT_MILLIS = 2 * 60 * 60 * 1000; // 2 hours
const TIME_LABEL_SPACING_MILLIS = 30 * 60 * 1000; // 30 minutes

const VISIBLE_CHANNEL_COUNT = 8; // No of channel to show at a time
// const VERTICAL_SCROLL_BOTTOM_PADDING_ITEM = VISIBLE_CHANNEL_COUNT / 2 - 1;
const VERTICAL_SCROLL_TOP_PADDING_ITEM = VISIBLE_CHANNEL_COUNT / 2 - 1;

const TVGuide = (props: { toggleRecording: (event: EPGEvent, callback: () => any) => void; unmount: () => void }) => {
    const { locale, currentChannelPosition, epgData, imageCache, setCurrentChannelPosition } = useContext(AppContext);

    const canvas = useRef<HTMLCanvasElement>(null);
    const epgWrapper = useRef<HTMLDivElement>(null);
    const programguideContents = useRef<HTMLDivElement>(null);
    const scrollAnimationId = useRef(0);
    const focusedEventPosition = useRef(-1);
    const focusedChannelPosition = useRef(currentChannelPosition);
    const timePosition = useRef(EPGUtils.getNow());

    const millisPerPixel = useRef(0);
    const timeOffset = useRef(0);
    const timeLowerBoundary = useRef(0);
    const timeUpperBoundary = useRef(0);
    const scrollX = useRef(0);
    const scrollY = useRef(0);

    const mDrawingRect = new Rect();
    const mMeasuringRect = new Rect();

    const mEPGBackground = '#1e1e1e';
    const mChannelLayoutMargin = 3;
    const mChannelLayoutPadding = 10;
    const mChannelLayoutHeight = 75;
    const mChannelLayoutWidth = 120;
    const mChannelLayoutBackground = '#323232';
    const mChannelLayoutBackgroundFocus = 'rgb(50,85,110)';

    const mEventLayoutBackground = '#234054';
    const mEventLayoutBackgroundCurrent = 'rgb(50,85,110)';
    const mEventLayoutBackgroundFocus = 'rgb(65,182,230)';
    const mEventLayoutTextColor = '#cccccc';
    const mEventLayoutTextSize = 28;
    const mEventLayoutRecordingColor = '#ff0000';

    const mDetailsLayoutMargin = 5;
    const mDetailsLayoutPadding = 8;
    const mDetailsLayoutTextColor = '#cccccc';
    const mDetailsLayoutTitleTextSize = 30;
    const mDetailsLayoutSubTitleTextSize = 26;
    const mDetailsLayoutSubTitleTextColor = '#969696';
    const mDetailsLayoutDescriptionTextSize = 28;

    const mTimeBarHeight = 70;
    const mTimeBarTextSize = 32;
    const mTimeBarNowTextSize = 22;
    const mTimeBarLineWidth = 3;
    const mTimeBarLineColor = '#c57120';
    const mTimeBarLinePositionColor = 'rgb(65,182,230)';

    const resetBoundaries = () => {
        millisPerPixel.current = calculateMillisPerPixel();
        timeOffset.current = calculatedBaseLine();
        timeLowerBoundary.current = getTimeFrom(0);
        timeUpperBoundary.current = getTimeFrom(getWidth());
    };

    const calculateMillisPerPixel = () => {
        return HOURS_IN_VIEWPORT_MILLIS / (getWidth() - mChannelLayoutWidth - mChannelLayoutMargin);
    };

    const calculatedBaseLine = () => {
        //return LocalDateTime.now().toDateTime().minusMillis(DAYS_BACK_MILLIS).getMillis();
        return EPGUtils.getNow() - DAYS_BACK_MILLIS;
    };

    const getFirstVisibleChannelPosition = () => {
        const y = getScrollY(false);
        const position =
            Math.ceil((y - mChannelLayoutMargin - mTimeBarHeight) / (mChannelLayoutHeight + mChannelLayoutMargin)) + 0;
        return position;
    };

    const getLastVisibleChannelPosition = () => {
        const y = getScrollY(false);
        const screenHeight = getChannelListHeight();
        const position = Math.floor(
            (y + screenHeight - mTimeBarHeight - mChannelLayoutMargin) / (mChannelLayoutHeight + mChannelLayoutMargin)
        );
        return position;
    };

    const getXFrom = (time: number) => {
        return Math.floor(
            (time - timeLowerBoundary.current) / millisPerPixel.current +
                mChannelLayoutMargin +
                mChannelLayoutWidth +
                mChannelLayoutMargin
        );
    };

    const getTopFrom = (position: number) => {
        const y = position * (mChannelLayoutHeight + mChannelLayoutMargin) + mChannelLayoutMargin + mTimeBarHeight;
        return y - getScrollY(false);
    };

    const getTimeFrom = (x: number) => {
        return x * millisPerPixel.current + timeOffset.current;
    };

    const shouldDrawTimeLine = (now: number) => {
        return now >= timeLowerBoundary.current && now < timeUpperBoundary.current;
    };

    const shouldDrawPastTimeOverlay = (now: number) => {
        return now >= timeLowerBoundary.current;
    };

    const isEventVisible = (start: number, end: number) => {
        return (
            (start >= timeLowerBoundary.current && start <= timeUpperBoundary.current) ||
            (end >= timeLowerBoundary.current && end <= timeUpperBoundary.current) ||
            (start <= timeLowerBoundary.current && end >= timeUpperBoundary.current)
        );
    };

    const getScrollX = (neglect = true) => (neglect ? 0 : scrollX.current);

    const setScrollX = (value: number) => (scrollX.current = value);

    const getScrollY = (neglect = true) => (neglect ? 0 : scrollY.current);

    const setScrollY = (value: number) => (scrollY.current = value);

    const getWidth = () => {
        return window.innerWidth;
    };

    const getHeight = () => {
        return window.innerHeight;
    };

    const getChannelListHeight = () => {
        return mTimeBarHeight + (mChannelLayoutMargin + mChannelLayoutHeight) * VISIBLE_CHANNEL_COUNT;
    };

    const onDraw = (canvas: CanvasRenderingContext2D) => {
        if (epgData?.hasData()) {
            timeLowerBoundary.current = getTimeFrom(getScrollX(false));
            timeUpperBoundary.current = getTimeFrom(getScrollX(false) + getWidth());
            const drawingRect = mDrawingRect;
            //console.log("X:" + getScrollX());
            drawingRect.left = getScrollX();
            drawingRect.top = getScrollY();
            drawingRect.right = drawingRect.left + getWidth();
            drawingRect.bottom = drawingRect.top + getHeight();
            // clear rect
            //canvas.clearRect(0, 0, this.getWidth(), this.getChannelListHeight());
            // draw background
            // canvas.fillStyle = '#000000';
            // canvas.fillRect(drawingRect.left, drawingRect.top, drawingRect.width, drawingRect.height);
            drawBackground(canvas, drawingRect);
            drawChannelListItems(canvas, drawingRect);
            drawEvents(canvas, drawingRect);
            drawTimebar(canvas, drawingRect);
            //drawResetButton(canvas, drawingRect);
            drawTimeLine(canvas, drawingRect);
            // draw details pane
            drawDetails(canvas, drawingRect);
        }
    };

    /**
     * draw background and use cache for future
     *
     * @param canvas
     * @param drawingRect
     */
    const drawBackground = async (canvas: CanvasRenderingContext2D, drawingRect: Rect) => {
        drawingRect.left = getScrollX();
        drawingRect.top = getScrollY();
        drawingRect.right = drawingRect.left + getWidth();
        drawingRect.bottom = drawingRect.top + getHeight();

        canvas.fillStyle = '#000000';
        canvas.fillRect(drawingRect.left, drawingRect.top, drawingRect.width, drawingRect.height);
        // channel Background
        mMeasuringRect.left = getScrollX();
        mMeasuringRect.top = getScrollY();
        mMeasuringRect.right = drawingRect.left + mChannelLayoutWidth;
        mMeasuringRect.bottom = mMeasuringRect.top + getChannelListHeight();

        //mPaint.setColor(mChannelLayoutBackground);
        canvas.fillStyle = mChannelLayoutBackground;
        canvas.fillRect(mMeasuringRect.left, mMeasuringRect.top, mMeasuringRect.width, mMeasuringRect.height);

        // events Background
        drawingRect.left = mChannelLayoutWidth + mChannelLayoutMargin;
        drawingRect.top = mTimeBarHeight + mChannelLayoutMargin;
        drawingRect.right = getWidth();
        drawingRect.bottom = getChannelListHeight();
        canvas.globalAlpha = 1.0;
        // put stroke color to transparent
        //canvas.strokeStyle = "transparent";
        canvas.strokeStyle = 'gradient';
        //mPaint.setColor(mChannelLayoutBackground);
        // canvas.fillStyle = mChannelLayoutBackground;
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
        canvas.strokeStyle = mEventLayoutTextColor;
        canvas.moveTo(drawingRect.left, drawingRect.top);
        canvas.lineTo(drawingRect.left, drawingRect.bottom);
        canvas.stroke();

        // timebar
        drawingRect.left = getScrollX() + mChannelLayoutWidth + mChannelLayoutMargin;
        drawingRect.top = getScrollY();
        drawingRect.right = drawingRect.left + getWidth();
        drawingRect.bottom = drawingRect.top + mTimeBarHeight;

        // Background
        canvas.fillStyle = mChannelLayoutBackground;
        canvas.fillRect(drawingRect.left, drawingRect.top, drawingRect.width, drawingRect.height);
    };

    const drawDetails = (canvas: CanvasRenderingContext2D, drawingRect: Rect) => {
        // Background
        drawingRect.left = getScrollX();
        drawingRect.top = getChannelListHeight();
        drawingRect.right = getWidth();
        drawingRect.bottom = getHeight();

        canvas.fillStyle = '#000000'; //mChannelLayoutBackground'';
        canvas.fillRect(drawingRect.left, drawingRect.top, drawingRect.width, drawingRect.height);

        // rect for logo
        drawingRect.left = getScrollX();
        drawingRect.top = getChannelListHeight();
        drawingRect.right = drawingRect.left + 450;
        drawingRect.bottom = getHeight();

        const channel = epgData.getChannel(focusedChannelPosition.current);
        const imageURL = channel?.getImageURL();
        const image = imageURL && imageCache.get(imageURL);
        if (image) {
            const imageDrawingRect = getDrawingRectForChannelImage(drawingRect, image);
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
        drawingRect.top = getChannelListHeight();
        drawingRect.right = getWidth();
        drawingRect.bottom = getHeight();

        const focusedEvent = epgData.getEvent(focusedChannelPosition.current, focusedEventPosition.current);
        if (focusedEvent) {
            // rect event details
            drawingRect.left += mDetailsLayoutMargin;
            drawingRect.top += mDetailsLayoutTitleTextSize + mDetailsLayoutMargin;
            drawingRect.right -= mDetailsLayoutMargin;
            drawingRect.bottom -= mDetailsLayoutMargin;

            const leftBeforeRecMark = drawingRect.left;
            // draw recording mark
            if (epgData.isRecording(focusedEvent)) {
                const radius = 10;
                canvas.fillStyle = mEventLayoutRecordingColor;
                canvas.beginPath();
                canvas.arc(drawingRect.left + radius, drawingRect.top, radius, 0, 2 * Math.PI);
                canvas.fill();
                drawingRect.left += 2 * radius + mChannelLayoutPadding;
            }
            // draw title, description etc
            CanvasUtils.writeText(canvas, focusedEvent.getTitle(), drawingRect.left, drawingRect.top, {
                fontSize: mDetailsLayoutTitleTextSize,
                isBold: true,
                fillStyle: mDetailsLayoutTextColor
            });
            drawingRect.left = leftBeforeRecMark;
            if (focusedEvent.getSubTitle() !== undefined) {
                drawDetailsSubtitle(focusedEvent.getSubTitle(), canvas, drawingRect);
            }
            drawDetailsTimeInfo(focusedEvent, canvas, drawingRect);
            if (focusedEvent.getDescription() !== undefined) {
                drawDetailsDescription(focusedEvent.getDescription(), canvas, drawingRect);
            }
        }
    };

    const drawDetailsDescription = (description: string, canvas: CanvasRenderingContext2D, drawingRect: Rect) => {
        const drect = drawingRect.clone();
        drect.right = getWidth() - 10;
        drect.top += (mDetailsLayoutTitleTextSize + mDetailsLayoutPadding) * 2 + 3;
        // draw title, description etc
        canvas.font = mDetailsLayoutDescriptionTextSize + 'px Moonstone';
        canvas.fillStyle = mDetailsLayoutTextColor;
        CanvasUtils.wrapText(canvas, description, drect.left, drect.top, drect.width, mDetailsLayoutTitleTextSize + 5);
    };

    const drawDetailsTimeInfo = (event: EPGEvent, canvas: CanvasRenderingContext2D, drawingRect: Rect) => {
        const tDrawingRect = drawingRect.clone();
        tDrawingRect.right = getWidth() - 10;
        const timeFrameText = EPGUtils.toTimeFrameString(event.getStart(), event.getEnd(), locale);
        CanvasUtils.writeText(canvas, timeFrameText, tDrawingRect.right, tDrawingRect.top, {
            fontSize: mDetailsLayoutTitleTextSize,
            textAlign: 'right',
            isBold: true
        });
    };

    const drawDetailsSubtitle = (subtitle: string, canvas: CanvasRenderingContext2D, drawingRect: Rect) => {
        const drect = drawingRect.clone();
        drect.top += mDetailsLayoutTitleTextSize + mDetailsLayoutPadding;
        CanvasUtils.writeText(canvas, subtitle, drect.left, drect.top, {
            fontSize: mDetailsLayoutSubTitleTextSize,
            fillStyle: mDetailsLayoutSubTitleTextColor,
            isBold: true,
            maxWidth: drect.width
        });
    };

    const drawTimebar = (canvas: CanvasRenderingContext2D, drawingRect: Rect) => {
        drawingRect.left = getScrollX() + mChannelLayoutWidth + mChannelLayoutMargin;
        drawingRect.top = getScrollY();
        drawingRect.right = drawingRect.left + getWidth();
        drawingRect.bottom = drawingRect.top + mTimeBarHeight;
        // draw time stamps
        for (let i = 0; i < HOURS_IN_VIEWPORT_MILLIS / TIME_LABEL_SPACING_MILLIS; i++) {
            // Get time and round to nearest half hour
            let time =
                TIME_LABEL_SPACING_MILLIS *
                ((timeLowerBoundary.current + TIME_LABEL_SPACING_MILLIS * i + TIME_LABEL_SPACING_MILLIS / 2) /
                    TIME_LABEL_SPACING_MILLIS);
            time = EPGUtils.getRoundedDate(30, new Date(time)).getTime();

            const timeText = EPGUtils.toTimeString(time, locale);
            const x = getXFrom(time);
            const y = drawingRect.middle;
            CanvasUtils.writeText(canvas, timeText, x, y, {
                fontSize: mEventLayoutTextSize,
                fillStyle: mEventLayoutTextColor,
                textAlign: 'center',
                isBold: true
            });
        }

        drawTimebarDayIndicator(canvas, drawingRect);
        drawTimebarBottomStroke(canvas, drawingRect);
    };

    const drawTimebarDayIndicator = (canvas: CanvasRenderingContext2D, drawingRect: Rect) => {
        drawingRect.left = getScrollX();
        drawingRect.top = getScrollY();
        drawingRect.right = drawingRect.left + mChannelLayoutWidth;
        drawingRect.bottom = drawingRect.top + mTimeBarHeight;

        // Background
        canvas.fillStyle = mChannelLayoutBackground;
        canvas.fillRect(drawingRect.left, drawingRect.top, drawingRect.width, drawingRect.height);

        // Text
        const weekdayText = EPGUtils.getWeekdayName(timeLowerBoundary.current, locale);
        CanvasUtils.writeText(canvas, weekdayText, drawingRect.center, drawingRect.middle, {
            fontSize: mTimeBarTextSize,
            fillStyle: mEventLayoutTextColor,
            textAlign: 'center',
            isBold: true
        });
    };

    const drawTimebarBottomStroke = (canvas: CanvasRenderingContext2D, drawingRect: Rect) => {
        drawingRect.left = getScrollX();
        drawingRect.top = getScrollY() + mTimeBarHeight;
        drawingRect.right = drawingRect.left + getWidth();
        drawingRect.bottom = drawingRect.top + mChannelLayoutMargin;

        // Bottom stroke
        //mPaint.setColor(mEPGBackground);
        canvas.fillStyle = mEPGBackground;
        canvas.fillRect(drawingRect.left, drawingRect.top, drawingRect.width, drawingRect.height);
    };

    const drawTimeLine = (canvas: CanvasRenderingContext2D, drawingRect: Rect) => {
        const now = EPGUtils.getNow();

        if (shouldDrawPastTimeOverlay(now)) {
            // draw opaque overlay
            drawingRect.left = getScrollX() + mChannelLayoutWidth + mChannelLayoutMargin;
            drawingRect.top = getScrollY();
            drawingRect.right = getXFrom(now);
            drawingRect.bottom = drawingRect.top + getChannelListHeight();

            canvas.fillStyle = mTimeBarLineColor;
            const currentAlpha = canvas.globalAlpha;
            canvas.globalAlpha = 0.2;
            canvas.fillRect(drawingRect.left, drawingRect.top, drawingRect.width, drawingRect.height);
            canvas.globalAlpha = currentAlpha;
        }

        if (shouldDrawTimeLine(now)) {
            drawingRect.left = getXFrom(now);
            drawingRect.top = getScrollY();
            drawingRect.right = drawingRect.left + mTimeBarLineWidth;
            drawingRect.bottom = drawingRect.top + getChannelListHeight();

            //mPaint.setColor(mTimeBarLineColor);
            canvas.fillStyle = mTimeBarLineColor;
            //canvas.drawRect(drawingRect, mPaint);
            canvas.fillRect(drawingRect.left, drawingRect.top, drawingRect.width, drawingRect.height);
        }

        // draw current position
        drawingRect.left = getXFrom(timePosition.current);
        drawingRect.top = getScrollY() + mTimeBarHeight - mTimeBarTextSize + 10;
        drawingRect.right = drawingRect.left + mTimeBarLineWidth;
        drawingRect.bottom = drawingRect.top + getChannelListHeight();

        // draw now time stroke
        canvas.fillStyle = mTimeBarLinePositionColor;
        canvas.fillRect(drawingRect.left, drawingRect.top, drawingRect.width, drawingRect.height);

        // draw now time text
        drawingRect.top += mTimeBarNowTextSize / 2;
        drawingRect.left = getXFrom(timePosition.current) + mChannelLayoutPadding;
        const timeText = EPGUtils.toTimeString(timePosition.current, locale);
        CanvasUtils.writeText(canvas, timeText, drawingRect.left, drawingRect.top, {
            fontSize: mTimeBarNowTextSize,
            fillStyle: mTimeBarLinePositionColor,
            isBold: true
        });
    };

    const drawEvents = (canvas: CanvasRenderingContext2D, drawingRect: Rect) => {
        // Background
        drawingRect.left = mChannelLayoutWidth + mChannelLayoutMargin;
        drawingRect.top = mTimeBarHeight + mChannelLayoutMargin;
        drawingRect.right = getWidth();
        drawingRect.bottom = getChannelListHeight();

        const firstPos = getFirstVisibleChannelPosition();
        const lastPos = getLastVisibleChannelPosition();

        //console.log("Channel: First: " + firstPos + " Last: " + lastPos);
        //let transparentTop = firstPos + 3;
        //let transparentBottom = lastPos - 3;
        // canvas.globalAlpha = 0.0;
        for (let pos = firstPos; pos <= lastPos; pos++) {
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
            canvas.strokeStyle = mEventLayoutTextColor;
            canvas.moveTo(mChannelLayoutWidth + mChannelLayoutMargin, getTopFrom(pos));
            canvas.lineTo(getWidth(), getTopFrom(pos));
            canvas.stroke();

            const epgEvents = epgData.getEvents(pos);
            let wasVisible = false;
            //  the list is ordered by time so its only a few events processed
            epgEvents.forEach((event) => {
                const isVisible = isEventVisible(event.getStart(), event.getEnd());
                if (isVisible) {
                    wasVisible = true;
                    drawEvent(canvas, pos, event, drawingRect);
                }
                if (wasVisible && !isVisible) {
                    return;
                }
            });
        }
        canvas.globalAlpha = 1;
    };

    const drawEvent = (
        canvas: CanvasRenderingContext2D,
        channelPosition: number,
        event: EPGEvent,
        drawingRect: Rect
    ) => {
        const focusedEvent = epgData.getEvent(focusedChannelPosition.current, focusedEventPosition.current);

        // set starting minimal behind channel list
        setEventDrawingRectangle(channelPosition, event.getStart(), event.getEnd(), drawingRect);
        if (drawingRect.left < getScrollX() + mChannelLayoutWidth + mChannelLayoutMargin) {
            drawingRect.left = getScrollX() + mChannelLayoutWidth + mChannelLayoutMargin;
        }

        // Background
        canvas.fillStyle = event.isCurrent() ? mEventLayoutBackgroundCurrent : mEventLayoutBackground;
        if (event.getId() === focusedEvent?.getId()) {
            canvas.fillStyle = mEventLayoutBackgroundFocus;
        }

        if (event.isCurrent() || event.getId() === focusedEvent?.getId()) {
            canvas.fillRect(drawingRect.left + 1, drawingRect.top + 1, drawingRect.width + 1, drawingRect.height + 1);
        }

        // draw vertical line
        canvas.beginPath();
        canvas.lineWidth = 0.5;
        canvas.strokeStyle = mEventLayoutTextColor;
        canvas.moveTo(drawingRect.left, drawingRect.top + 1);
        canvas.lineTo(drawingRect.left, drawingRect.bottom + 2);
        canvas.stroke();

        if (epgData.isRecording(event)) {
            canvas.fillStyle = mEventLayoutRecordingColor;
            canvas.fillRect(drawingRect.left, drawingRect.top, drawingRect.width, 4);
        }

        // Add left and right inner padding
        drawingRect.left += mChannelLayoutPadding;
        drawingRect.right -= mChannelLayoutPadding;

        // Text
        CanvasUtils.writeText(canvas, event.getTitle(), drawingRect.left, drawingRect.middle, {
            fontSize: mEventLayoutTextSize,
            fillStyle: mEventLayoutTextColor,
            maxWidth: drawingRect.width
        });
        // if (event.getSubTitle()) {
        //     canvas.font = this.mEventLayoutTextSize - 6 + "px Moonstone";
        //     canvas.fillText(this.canvasUtils.getShortenedText(canvas, event.getSubTitle(), drawingRect), drawingRect.left, drawingRect.top + 18);
        // }
    };

    const setEventDrawingRectangle = (channelPosition: number, start: number, end: number, drawingRect: Rect) => {
        drawingRect.left = getXFrom(start);
        drawingRect.top = getTopFrom(channelPosition);
        drawingRect.right = getXFrom(end) - mChannelLayoutMargin;
        drawingRect.bottom = drawingRect.top + mChannelLayoutHeight;
        return drawingRect;
    };

    const drawChannelListItems = (canvas: CanvasRenderingContext2D, drawingRect: Rect) => {
        // Background
        mMeasuringRect.left = getScrollX();
        mMeasuringRect.top = getScrollY();
        mMeasuringRect.right = drawingRect.left + mChannelLayoutWidth;
        mMeasuringRect.bottom = mMeasuringRect.top + getChannelListHeight();

        const firstPos = getFirstVisibleChannelPosition();
        const lastPos = getLastVisibleChannelPosition();

        //console.log("Channel: First: " + firstPos + " Last: " + lastPos);

        for (let pos = firstPos; pos <= lastPos; pos++) {
            drawChannelItem(canvas, pos, drawingRect);
        }
    };

    /*
    drawChannelText(canvas, position, drawingRect) {
        drawingRect.left = getScrollX();
        drawingRect.top = getTopFrom(position);
        drawingRect.right = drawingRect.left + mChannelLayoutWidth;
        drawingRect.bottom = drawingRect.top + mChannelLayoutHeight;
 
        drawingRect.top += (((drawingRect.bottom - drawingRect.top) / 2) + (10/2));
 
        canvas.font = "bold " + mEventLayoutTextSize+"px Moonstone";
        let channelName = epgData.getChannel(position).getName();
        let channelNumber = epgData.getChannel(position).getId();
        //canvas.fillText(channelNumber, drawingRect.left, drawingRect.top);
        canvas.fillText(channelName, drawingRect.left + 20, drawingRect.top);
    }*/

    const drawChannelItem = (canvas: CanvasRenderingContext2D, position: number, drawingRect: Rect) => {
        drawingRect.left = getScrollX();
        drawingRect.top = getTopFrom(position);
        drawingRect.right = drawingRect.left + mChannelLayoutWidth;
        drawingRect.bottom = drawingRect.top + mChannelLayoutHeight;

        /*
                canvas.font = mEventLayoutTextSize + "px Moonstone";
                canvas.fillStyle = mEventLayoutTextColor;
                canvas.textAlign = 'right';
                canvas.fillText(epgData.getChannel(position).getChannelID(),
                     drawingRect.left + 60, drawingRect.top + mChannelLayoutHeight/2 + mEventLayoutTextSize/2 );
                canvas.textAlign = 'left';
                drawingRect.left += 75;
                canvas.fillText(canvasUtils.getShortenedText(canvas, epgData.getChannel(position).getName(), drawingRect),
                     drawingRect.left, drawingRect.top + mChannelLayoutHeight/2 + mEventLayoutTextSize/2 );
                */

        // Set background of focused channel
        if (focusedChannelPosition.current === position) {
            canvas.fillStyle = mChannelLayoutBackgroundFocus;
            canvas.fillRect(drawingRect.left, drawingRect.top, drawingRect.width, drawingRect.height);
        }

        // Loading channel image into target for
        const channel = epgData.getChannel(position);
        const imageURL = channel?.getImageURL();
        const image = imageURL && imageCache.get(imageURL);

        if (image) {
            drawingRect = getDrawingRectForChannelImage(drawingRect, image);
            canvas.drawImage(image, drawingRect.left, drawingRect.top, drawingRect.width, drawingRect.height);
        } else {
            canvas.textAlign = 'center';
            canvas.font = 'bold 17px Moonstone';
            canvas.fillStyle = mEventLayoutTextColor;
            CanvasUtils.wrapText(
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
    };

    const getDrawingRectForChannelImage = (drawingRect: Rect, image: HTMLImageElement) => {
        drawingRect.left += mChannelLayoutPadding;
        drawingRect.top += mChannelLayoutPadding;
        drawingRect.right -= mChannelLayoutPadding;
        drawingRect.bottom -= mChannelLayoutPadding;

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
    };

    const recalculateAndRedraw = (withAnimation: boolean) => {
        if (epgData !== null && epgData.hasData()) {
            resetBoundaries();
            scrollToChannelPosition(focusedChannelPosition.current, withAnimation);
        }
    };

    const handleKeyPress = (event: React.KeyboardEvent<HTMLDivElement>) => {
        const keyCode = event.keyCode;
        let eventPosition = focusedEventPosition.current;
        const channelPosition = focusedChannelPosition.current;

        // do not pass this event to parents
        switch (keyCode) {
            case 39: // right arrow
                event.stopPropagation();
                if (eventPosition < 0) {
                    const nextEvent = epgData.getEventAfterTimestamp(channelPosition, timePosition.current);
                    nextEvent && scrollToEventPosition(epgData.getEventPosition(channelPosition, nextEvent));
                    break;
                }
                eventPosition += 1;
                scrollToEventPosition(eventPosition);
                break;
            case 37: // left arrow
                event.stopPropagation();
                if (eventPosition < 0) {
                    const prevEvent = epgData.getEventBeforeTimestamp(channelPosition, timePosition.current);
                    prevEvent && scrollToEventPosition(epgData.getEventPosition(channelPosition, prevEvent));
                    break;
                }
                eventPosition -= 1;
                scrollToEventPosition(eventPosition);
                break;
            case 40: // arrow down
                event.stopPropagation();
                scrollDown();
                return;
            case 38: // arrow up
                event.stopPropagation();
                scrollUp();
                return;
            case 403:
                event.stopPropagation();
                if (eventPosition < 0) break;
                toggleRecording(channelPosition, eventPosition);
                break;
            case 461:
            case 406: // blue or back button hide epg/show tv
            case 66: // keyboard 'b'
                event.stopPropagation();
                props.unmount();
                break;
            case 13: // ok button -> switch to focused channel
                event.stopPropagation();
                props.unmount();
                setCurrentChannelPosition(channelPosition);
                break;
            default:
                console.log('EPG-keyPressed:', keyCode);
        }
    };

    const scrollUp = () => {
        let channelPosition = focusedChannelPosition.current;
        channelPosition -= 1;
        if (channelPosition < 0) {
            channelPosition = epgData.getChannelCount() - 1;
        }
        scrollToChannelPosition(channelPosition, false);
    };

    const scrollDown = () => {
        let channelPosition = focusedChannelPosition.current;
        channelPosition += 1;
        if (channelPosition > epgData.getChannelCount() - 1) {
            channelPosition = 0;
        }
        scrollToChannelPosition(channelPosition, false);
    };

    const handleScrollWheel = (event: React.WheelEvent) => {
        event.stopPropagation();
        event.deltaY < 0 ? scrollUp() : scrollDown();
        focus();
    };

    const handleClick = (event: React.MouseEvent) => {
        event.stopPropagation();
        setCurrentChannelPosition(focusedChannelPosition.current);
        props.unmount();
    };

    const toggleRecording = (channelPosition: number, eventPosition: number) => {
        // get current event
        const currentEvent = epgData.getEvent(channelPosition, eventPosition);
        props.toggleRecording(currentEvent, () => {
            updateCanvas();
        });
    };

    const scrollToEventPosition = (eventPosition: number) => {
        const eventCount = epgData.getEventCount(focusedChannelPosition.current);

        if (eventPosition < 0) {
            eventPosition = 0;
        } else if (eventPosition >= eventCount - 1) {
            eventPosition = eventCount - 1;
        }

        const targetEvent = epgData.getEvent(focusedChannelPosition.current, eventPosition);
        if (targetEvent) {
            const targetTimePosition = targetEvent.getStart() + 1;

            resetBoundaries();
            setTimePosition(targetTimePosition);
            setScrollX(getXFrom(targetTimePosition - HOURS_IN_VIEWPORT_MILLIS / 2));
            setFocusedEventPosition(eventPosition);
        } else {
            setFocusedEventPosition(-1);
        }
    };

    const scrollToChannelPosition = (channelPosition: number, withAnimation: boolean) => {
        // start scrolling after padding position top
        if (channelPosition < VERTICAL_SCROLL_TOP_PADDING_ITEM) {
            setScrollY(0);
            setFocusedChannelPosition(channelPosition);
            return;
        }

        // stop scrolling before padding position bottom
        const maxPosition = epgData.getChannelCount() - (VISIBLE_CHANNEL_COUNT - VERTICAL_SCROLL_TOP_PADDING_ITEM);

        // scroll to channel position or max position
        const scrollTarget =
            (mChannelLayoutMargin + mChannelLayoutHeight) *
            (Math.min(maxPosition, channelPosition) - VERTICAL_SCROLL_TOP_PADDING_ITEM);

        if (!withAnimation) {
            setScrollY(scrollTarget);
            setFocusedChannelPosition(channelPosition);
            return;
        } else {
            const scrollDistance = scrollTarget - getScrollY();
            const scrollDelta = scrollDistance / (mChannelLayoutHeight / 5);
            cancelScrollAnimation();
            scrollAnimationId.current = requestAnimationFrame(() => {
                animateScroll(scrollDelta, scrollTarget);
            });
            //console.log("Scrolled to y=%d, position=%d", scrollY, channelPosition);
        }
    };

    const cancelScrollAnimation = () => {
        scrollAnimationId.current && cancelAnimationFrame(scrollAnimationId.current);
    };

    const animateScroll = (scrollDelta: number, scrollTarget: number) => {
        if (scrollDelta < 0 && getScrollY() <= scrollTarget) {
            cancelScrollAnimation();
            return;
        }
        if (scrollDelta > 0 && getScrollY() >= scrollTarget) {
            cancelScrollAnimation();
            return;
        }
        // console.log("scrolldelta=%d, scrolltarget=%d, scrollY=%d", scrollDelta, scrollTarget, this.scrollY);
        setScrollY(getScrollY() + scrollDelta);
        scrollAnimationId.current = requestAnimationFrame(() => {
            animateScroll(scrollDelta, scrollTarget);
        });
        updateCanvas();
    };

    const setFocusedEventPosition = (focusedEventPos: number) => {
        focusedEventPosition.current = focusedEventPos;
        updateCanvas();
    };

    const setFocusedChannelPosition = (focusedChannelPos: number) => {
        focusedChannelPosition.current = focusedChannelPos;
        const targetEvent = epgData.getEventAtTimestamp(focusedChannelPosition.current, timePosition.current);
        setFocusedEventPosition(
            targetEvent ? epgData.getEventPosition(focusedChannelPosition.current, targetEvent) : -1
        );
    };

    const setTimePosition = (timePos: number) => {
        timePosition.current = timePos;
    };

    useEffect(() => {
        recalculateAndRedraw(false);
        focus();

        // set current time and event when mounted
        const targetTime = timePosition.current;
        const targetEvent = epgData.getEventAtTimestamp(focusedChannelPosition.current, targetTime);
        targetEvent && scrollToEventPosition(epgData.getEventPosition(currentChannelPosition, targetEvent));
        resetBoundaries();
        setTimePosition(targetTime);
        setScrollX(getXFrom(targetTime - HOURS_IN_VIEWPORT_MILLIS / 2));
        updateCanvas();

        return () => {
            // clear timeout in case component is unmounted
            cancelScrollAnimation();
        };
    }, []);

    const updateCanvas = () => {
        if (canvas.current) {
            const ctx = canvas.current.getContext('2d');

            // clear
            ctx && ctx.clearRect(0, 0, getWidth(), getHeight());

            // draw child elements
            ctx && onDraw(ctx);
        }
    };

    const focus = () => {
        epgWrapper.current?.focus();
    };

    return (
        <div
            id="epg-wrapper"
            ref={epgWrapper}
            tabIndex={-1}
            onKeyDown={handleKeyPress}
            onWheel={handleScrollWheel}
            onClick={handleClick}
            className="epg"
        >
            <div className="programguide-contents" ref={programguideContents}>
                <canvas ref={canvas} width={getWidth()} height={getHeight()} style={{ display: 'block' }} />
            </div>
        </div>
    );
};

export default TVGuide;
