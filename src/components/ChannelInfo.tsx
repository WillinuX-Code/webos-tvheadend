import React, { useContext, useEffect, useRef } from 'react';
import Rect from '../models/Rect';
import EPGUtils from '../utils/EPGUtils';
import CanvasUtils, { WriteTextOptions } from '../utils/CanvasUtils';
import AppContext from '../AppContext';
import '../styles/app.css';

const ChannelInfo = (props: { unmount: () => void }) => {
    const { locale, epgData, imageCache, currentChannelPosition } = useContext(AppContext);

    const canvas = useRef<HTMLCanvasElement>(null);
    const infoWrapper = useRef<HTMLDivElement>(null);
    const timeoutReference = useRef<NodeJS.Timeout | null>(null);
    const intervalReference = useRef<NodeJS.Timeout | null>(null);

    const mChannelInfoHeight = 150;
    const mChannelInfoTitleSize = 42;
    const mChannelInfoKeyDescSize = 20;
    const mChannelInfoKeyPadding = 20;
    const mChannelInfoKeyRectWidth = 20;
    const mChannelLayoutTextColor = '#cccccc';
    const mChannelLayoutTitleTextColor = '#969696';
    const mChannelInfoTimeBoxWidth = 375;
    const mChannelLayoutMargin = 3;
    const mChannelLayoutPadding = 7;
    const mChannelNextTitleMaxLength = 900;
    //const mChannelLayoutBackground = '#323232';
    //const mChannelLayoutBackgroundFocus = 'rgba(29,170,226,1)';

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

        // pass unhandled events to parent
        if (!event.isPropagationStopped) return event;
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

        const channel = epgData.getChannel(currentChannelPosition);

        // should not happen, but better check it
        if (!channel) return;

        // channel number
        //canvas.strokeStyle = ;
        // drawingRect.top = 70;
        // drawingRect.left += 100;
        // canvas.font = "bold " + mChannelInfoTextSize + "px Moonstone";
        // canvas.fillStyle = mChannelLayoutTextColor;
        // canvas.textAlign = 'right';
        // canvas.fillText(channel.getChannelID(), drawingRect.left, drawingRect.top);

        // channel name
        // drawingRect.left += 15;
        // drawingRect.top += mChannelInfoTitleSize + mChannelLayoutPadding;
        // drawingRect.right = getWidth();
        // canvas.font = "bold " + mChannelInfoTitleSize + "px Moonstone";
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
        canvas.font = 'bold ' + mChannelInfoTitleSize + 'px Moonstone';
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
            // draw recording mark
            if (epgData.isRecording(currentEvent)) {
                const radius = 10;
                canvas.fillStyle = '#FF0000';
                canvas.beginPath();
                canvas.arc(drawingRect.left + radius, drawingRect.top - radius, radius, 0, 2 * Math.PI);
                canvas.fill();
                drawingRect.left += 2 * radius + 2 * mChannelLayoutPadding;
            }

            // draw current event
            canvas.fillStyle = mChannelLayoutTextColor;
            canvas.fillText(
                CanvasUtils.getShortenedText(canvas, currentEvent.getTitle(), drawingRect.width),
                drawingRect.left,
                drawingRect.top
            );

            // draw title timeframe
            drawingRect.right += mChannelInfoTimeBoxWidth;
            drawingRect.left = drawingRect.right - mChannelLayoutPadding - 20;
            canvas.textAlign = 'right';
            canvas.fillText(
                EPGUtils.toTimeFrameString(currentEvent.getStart(), currentEvent.getEnd(), locale),
                drawingRect.left,
                drawingRect.top
            );
            canvas.textAlign = 'left';

            // draw subtitle event
            canvas.font = mChannelInfoTitleSize - 8 + 'px Moonstone';
            drawingRect.top += mChannelInfoTitleSize - 5 + mChannelLayoutPadding;
            if (currentEvent.getSubTitle() !== undefined) {
                drawingRect.left = left;
                drawingRect.right -= mChannelInfoTimeBoxWidth;
                canvas.fillStyle = mChannelLayoutTitleTextColor;
                canvas.fillText(
                    CanvasUtils.getShortenedText(canvas, currentEvent.getSubTitle(), drawingRect.width),
                    drawingRect.left,
                    drawingRect.top
                );
                drawingRect.right += mChannelInfoTimeBoxWidth;
            }

            // draw current time in programm as well as overall durations
            const runningTime = EPGUtils.toDuration(currentEvent.getStart(), EPGUtils.getNow());
            const remainingTime = Math.ceil((currentEvent.getEnd() - EPGUtils.getNow()) / 1000 / 60);
            drawingRect.left = drawingRect.right - mChannelLayoutPadding - 20;
            canvas.textAlign = 'right';
            canvas.font = mChannelInfoTitleSize - 8 + 'px Moonstone';
            canvas.fillStyle = mChannelLayoutTitleTextColor;
            canvas.fillText(runningTime + ' (+' + remainingTime + ')', drawingRect.left, drawingRect.top);

            // draw next event
            drawingRect.top += mChannelInfoTitleSize - 14 + mChannelLayoutPadding;
            const nextEventTextOptions: WriteTextOptions = {
                textAlign: 'right',
                textBaseline: 'alphabetic',
                fontSize: mChannelInfoTitleSize - 18
            };

            // needs to be set for measurement
            if (nextEvent !== undefined) {
                canvas.font = mChannelInfoTitleSize - 18 + 'px Moonstone';
                const titleMetrics = canvas.measureText(nextEvent.getTitle());
                const titleLength =
                    titleMetrics.width > mChannelNextTitleMaxLength ? mChannelNextTitleMaxLength : titleMetrics.width;
                canvas.fillStyle = mChannelLayoutTextColor;
                CanvasUtils.writeText(canvas, nextEvent.getTitle(), drawingRect.left, drawingRect.top, {
                    ...nextEventTextOptions,
                    maxWidth: titleLength < mChannelNextTitleMaxLength ? undefined : mChannelNextTitleMaxLength
                });
                drawingRect.left -= titleLength + mChannelLayoutPadding;
                CanvasUtils.writeText(
                    canvas,
                    EPGUtils.toTimeFrameString(nextEvent.getStart(), nextEvent.getEnd(), locale),
                    drawingRect.left,
                    drawingRect.top,
                    { ...nextEventTextOptions, fillStyle: 'rgb(65, 182, 230)' }
                );
            }

            // draw color keys description
            drawingRect.top -= mChannelInfoKeyDescSize / 2;
            canvas.font = mChannelInfoKeyDescSize + 'px Moonstone';
            canvas.textAlign = 'left';

            // red
            drawingRect.left = left;
            canvas.fillStyle = '#EF3343';
            canvas.fillRect(drawingRect.left, drawingRect.top, mChannelInfoKeyRectWidth, 10);

            drawingRect.left += mChannelInfoKeyRectWidth + mChannelLayoutPadding;
            const recMetrics = canvas.measureText('Rec');
            CanvasUtils.writeText(canvas, 'Rec', drawingRect.left, drawingRect.top + 5);

            // green
            drawingRect.left += recMetrics.width + mChannelLayoutPadding + mChannelInfoKeyPadding;
            canvas.fillStyle = '#46BB3E';
            canvas.fillRect(drawingRect.left, drawingRect.top, mChannelInfoKeyRectWidth, 10);

            drawingRect.left += mChannelInfoKeyRectWidth + mChannelLayoutPadding;
            const menuMetrics = canvas.measureText('Menu');
            CanvasUtils.writeText(canvas, 'Menu', drawingRect.left, drawingRect.top + 5);

            // yellow
            drawingRect.left += menuMetrics.width + mChannelLayoutPadding + mChannelInfoKeyPadding;
            canvas.fillStyle = '#FBC821';
            canvas.fillRect(drawingRect.left, drawingRect.top, mChannelInfoKeyRectWidth, 10);

            drawingRect.left += mChannelInfoKeyRectWidth + mChannelLayoutPadding;
            const audioMetrics = canvas.measureText('Audio');
            CanvasUtils.writeText(canvas, 'Audio', drawingRect.left, drawingRect.top + 5);

            // blue
            drawingRect.left += audioMetrics.width + mChannelLayoutPadding + mChannelInfoKeyPadding;
            canvas.fillStyle = '#4065B8';
            canvas.fillRect(drawingRect.left, drawingRect.top, mChannelInfoKeyRectWidth, 10);

            drawingRect.left += mChannelInfoKeyRectWidth + mChannelLayoutPadding;
            CanvasUtils.writeText(canvas, 'EPG', drawingRect.left, drawingRect.top + 5);

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
        focus();

        return () => {
            timeoutReference.current && clearTimeout(timeoutReference.current);
            intervalReference.current && clearInterval(intervalReference.current);
        };
    }, []);

    useEffect(() => {
        // update the canvas in short intervals, to display the remaining time live
        intervalReference.current && clearInterval(intervalReference.current);
        intervalReference.current = setInterval(() => {
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
