import React, { useContext, useEffect, useRef } from 'react';
import Rect from '../models/Rect';
import EPGUtils from '../utils/EPGUtils';
import CanvasUtils from '../utils/CanvasUtils';
import AppContext from '../AppContext';
import '../styles/app.css';

const ChannelInfo = (props: { unmount: () => void }) => {
    const { locale, epgData, imageCache, currentChannelPosition } = useContext(AppContext);

    const canvas = useRef<HTMLCanvasElement>(null);
    const infoWrapper = useRef<HTMLDivElement>(null);
    const epgUtils = new EPGUtils();
    const canvasUtils = new CanvasUtils();
    const timeoutReference = useRef<NodeJS.Timeout | null>(null);
    const intervalReference = useRef<NodeJS.Timeout | null>(null);

    const mChannelInfoHeight = 150;
    const mChannelInfoTitleSize = 42;
    const mChannelLayoutTextColor = '#d6d6d6';
    const mChannelLayoutTitleTextColor = '#969696';
    const mChannelInfoTimeBoxWidth = 375;
    const mChannelLayoutMargin = 3;
    const mChannelLayoutPadding = 7;
    //const mChannelLayoutBackground = '#323232';
    //const mChannelLayoutBackgroundFocus = 'rgba(65,182,230,1)';

    const handleKeyPress = (event: React.KeyboardEvent<HTMLDivElement>) => {
        const keyCode = event.keyCode;

        switch (keyCode) {
            case 461: // back button
            case 13: // ok button -> switch to focused channel
                // do not pass this event to parent
                event.stopPropagation();
                props.unmount();
                break;
        }
    };

    const drawChannelInfo = (canvas: CanvasRenderingContext2D) => {
        // Background
        let drawingRect = new Rect();
        drawingRect.left = 0;
        drawingRect.top = 0;
        drawingRect.right = getWidth();
        drawingRect.bottom = getHeight();
        canvas.globalAlpha = 1.0;
        // put stroke color to transparent
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
        grd.addColorStop(0, 'rgba(11, 39, 58, 0.9)');
        grd.addColorStop(0.5, 'rgba(35, 64, 84, 0.9)');
        grd.addColorStop(1, 'rgba(11, 39, 58, 0.9)');

        // Fill with gradient
        canvas.fillStyle = grd;
        //canvas.fillStyle = "rgba(40, 40, 40, 0.7)";
        canvas.fillRect(drawingRect.left, drawingRect.top, drawingRect.width, drawingRect.bottom);

        //console.log("Channel: First: " + firstPos + " Last: " + lastPos);
        drawingRect.left += mChannelLayoutMargin;
        drawingRect.top += mChannelLayoutMargin;
        drawingRect.right -= mChannelLayoutMargin;
        drawingRect.bottom -= mChannelLayoutMargin;

        console.log('display channel info for: ' + currentChannelPosition);
        const channel = epgData.getChannel(currentChannelPosition);
        console.log(channel);

        // should not happen, but better check it
        if (!channel) return;

        // channel number
        //canvas.strokeStyle = ;
        // drawingRect.top = 70;
        // drawingRect.left += 100;
        // canvas.font = "bold " + mChannelInfoTextSize + "px Arial";
        // canvas.fillStyle = mChannelLayoutTextColor;
        // canvas.textAlign = 'right';
        // canvas.fillText(channel.getChannelID(), drawingRect.left, drawingRect.top);

        // channel name
        // drawingRect.left += 15;
        // drawingRect.top += mChannelInfoTitleSize + mChannelLayoutPadding;
        // drawingRect.right = getWidth();
        // canvas.font = "bold " + mChannelInfoTitleSize + "px Arial";
        // canvas.textAlign = 'left';
        // canvas.fillText(canvasUtils.getShortenedText(canvas, channel.getName(), drawingRect),
        //     drawingRect.left, drawingRect.top);

        // channel logo
        drawingRect.left += 20;
        drawingRect.top = 0;
        drawingRect.right = drawingRect.left + drawingRect.height + 50;
        //drawingRect.bottom = getHeight();
        canvas.textAlign = 'left';
        const imageURL = channel.getImageURL();
        const image = imageURL && imageCache.get(imageURL);
        if (image !== undefined) {
            drawingRect = getDrawingRectForChannelImage(drawingRect, image);
            canvas.drawImage(image, drawingRect.left, drawingRect.top, drawingRect.width, drawingRect.height);
        }

        // channel event
        drawingRect.left += drawingRect.right + 20;
        drawingRect.right = getWidth();
        drawingRect.top = getHeight() / 2 - mChannelInfoTitleSize + mChannelInfoTitleSize / 2 + mChannelLayoutPadding;
        canvas.font = mChannelInfoTitleSize + 'px Arial';
        canvas.fillStyle = mChannelLayoutTextColor;
        canvas.textAlign = 'left';
        let currentEvent, nextEvent;

        for (const event of channel.getEvents()) {
            if (event.isCurrent()) {
                currentEvent = event;
                continue;
            }
            if (currentEvent) {
                nextEvent = event;
                break;
            }
        }

        if (currentEvent !== undefined) {
            const left = drawingRect.left;
            drawingRect.right -= mChannelInfoTimeBoxWidth;

            // draw current event
            canvas.fillText(
                canvasUtils.getShortenedText(canvas, currentEvent.getTitle(), drawingRect.width),
                drawingRect.left,
                drawingRect.top
            );

            // draw title timeframe
            drawingRect.right += mChannelInfoTimeBoxWidth;
            drawingRect.left = drawingRect.right - mChannelLayoutPadding - 20;
            canvas.textAlign = 'right';
            canvas.fillText(
                epgUtils.toTimeFrameString(currentEvent.getStart(), currentEvent.getEnd(), locale),
                drawingRect.left,
                drawingRect.top
            );
            canvas.textAlign = 'left';

            // draw subtitle event
            canvas.font = 'bold ' + (mChannelInfoTitleSize - 8) + 'px Arial';
            drawingRect.top += mChannelInfoTitleSize + mChannelLayoutPadding;
            if (currentEvent.getSubTitle() !== undefined) {
                drawingRect.left = left;
                drawingRect.right -= mChannelInfoTimeBoxWidth;
                canvas.fillStyle = mChannelLayoutTitleTextColor;
                canvas.fillText(
                    canvasUtils.getShortenedText(canvas, currentEvent.getSubTitle(), drawingRect.width),
                    drawingRect.left,
                    drawingRect.top
                );
                drawingRect.right += mChannelInfoTimeBoxWidth;
            }

            // draw current time in programm as well as overall durations
            const runningTime = epgUtils.toDuration(currentEvent.getStart(), epgUtils.getNow());
            const remainingTime = Math.ceil((currentEvent.getEnd() - epgUtils.getNow()) / 1000 / 60);
            drawingRect.left = drawingRect.right - mChannelLayoutPadding - 20;
            canvas.textAlign = 'right';
            canvas.font = mChannelInfoTitleSize - 8 + 'px Arial';
            canvas.fillStyle = mChannelLayoutTitleTextColor;
            canvas.fillText(runningTime + ' (+' + remainingTime + ')', drawingRect.left, drawingRect.top);

            // draw next event
            if (nextEvent !== undefined) {
                drawingRect.top += mChannelInfoTitleSize - 15 + mChannelLayoutPadding;
                canvas.font = mChannelInfoTitleSize - 15 + 'px Arial';
                canvas.fillStyle = 'rgb(65, 182, 230)';
                canvas.fillText(
                    epgUtils.toTimeFrameString(nextEvent.getStart(), nextEvent.getEnd(), locale) +
                        ':   ' +
                        nextEvent.getTitle(),
                    drawingRect.left,
                    drawingRect.top
                );
            }

            // draw upcoming progress
            const channelEventProgressRect = new Rect(0, 0, 6, getWidth());
            const grd = canvas.createLinearGradient(
                channelEventProgressRect.left,
                channelEventProgressRect.left,
                channelEventProgressRect.right,
                channelEventProgressRect.left
            );
            grd.addColorStop(0, 'rgba(80, 80, 80, 0.75)');
            grd.addColorStop(0.5, 'rgba(200, 200, 200, 0.75)');
            grd.addColorStop(1, 'rgba(80, 80, 80, 0.75)');
            const grd2 = canvas.createLinearGradient(
                channelEventProgressRect.left,
                channelEventProgressRect.left,
                channelEventProgressRect.right,
                channelEventProgressRect.left
            );
            grd2.addColorStop(0, 'rgba(19, 126, 169, 0.75)');
            grd2.addColorStop(0.5, 'rgba(65, 182, 230, 0.75)');
            grd2.addColorStop(1, 'rgba(19, 126, 169, 0.75)');

            // draw base progress line
            canvas.fillStyle = grd;
            canvas.fillRect(
                channelEventProgressRect.left,
                channelEventProgressRect.top,
                channelEventProgressRect.width,
                channelEventProgressRect.height
            );

            // draw past progress
            canvas.fillStyle = grd2;
            canvas.fillRect(
                channelEventProgressRect.left,
                channelEventProgressRect.top,
                channelEventProgressRect.width * currentEvent.getDoneFactor(),
                channelEventProgressRect.height
            );
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
            const padding = (rectHeight - rectWidth * imageRatio) / 2;
            drawingRect.top += padding;
            drawingRect.bottom -= padding;
        } else if (imageWidth <= imageHeight) {
            const padding = (rectWidth - rectHeight / imageRatio) / 2;
            drawingRect.left += padding;
            drawingRect.right -= padding;
        }

        return drawingRect;
    };

    const getWidth = () => {
        return window.innerWidth;
    };

    const getHeight = () => {
        return mChannelInfoHeight;
    };

    /** set timeout to automatically unmount */
    const resetUnmountTimeout = () => {
        timeoutReference.current && clearTimeout(timeoutReference.current);
        timeoutReference.current = setTimeout(() => props.unmount(), 8000);
    };

    useEffect(() => {
        return () => {
            timeoutReference.current && clearTimeout(timeoutReference.current);
            intervalReference.current && clearInterval(intervalReference.current);
        };
    }, []);

    useEffect(() => {
        // update the canvas in short intervals, to display the remaining time live
        intervalReference.current && clearInterval(intervalReference.current);
        intervalReference.current = setInterval(() => {
            focus();
            updateCanvas();
        }, 500);

        updateCanvas();
        resetUnmountTimeout();
    }, [currentChannelPosition]);

    const focus = () => {
        infoWrapper.current?.focus();
    };

    const updateCanvas = () => {
        if (canvas.current) {
            const ctx = canvas.current.getContext('2d');
            // clear
            ctx && ctx.clearRect(0, 0, getWidth(), getHeight());

            // draw child elements
            ctx && onDraw(ctx);
        }
    };

    const onDraw = (canvas: CanvasRenderingContext2D) => {
        if (epgData !== null && epgData.hasData()) {
            drawChannelInfo(canvas);
        }
    };

    return (
        <div
            id="channelinfo-wrapper"
            ref={infoWrapper}
            tabIndex={-1}
            onKeyDown={handleKeyPress}
            className="channelInfo"
        >
            <canvas ref={canvas} width={getWidth()} height={getHeight()} style={{ display: 'block' }} />
        </div>
    );
};

export default ChannelInfo;
