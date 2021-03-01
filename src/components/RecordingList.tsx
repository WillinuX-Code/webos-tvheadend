import React, { useContext, useEffect, useRef, useState } from 'react';
import Rect from '../models/Rect';
import CanvasUtils from '../utils/CanvasUtils';
import AppContext from '../AppContext';
import ChannelListDetails from './ChannelListDetails';
import EPGEvent from '../models/EPGEvent';
import '../styles/app.css';
import DialogPopup from './DialogPopup';
import EPGChannelRecording from '../models/EPGChannelRecording';
import EPGUtils from '../utils/EPGUtils';

const VERTICAL_SCROLL_TOP_PADDING_ITEM = 5;
const IS_DEBUG = false;

enum State {
    NORMAL = 'normal',
    DETAILS = 'details',
    DELETE_DIALOG = 'deleteDialog',
    CANCEL_DIALOG = 'cancelDialog'
}

interface DetailsState {
    focusedChannelRecording?: EPGChannelRecording;
    focusedEvent?: EPGEvent;
}

const RecordingList = (props: {
    deleteRecording: (event: EPGEvent) => void;
    cancelRecording: (event: EPGEvent) => void;
    unmount: () => void;
    recordings: EPGChannelRecording[];
}) => {
    const { imageCache, currentRecordingPosition, setCurrentRecordingPosition } = useContext(AppContext);

    const canvas = useRef<HTMLCanvasElement>(null);
    const listWrapper = useRef<HTMLDivElement>(null);
    const scrollAnimationId = useRef(0);
    const scrollY = useRef(0);
    const recordPosition = useRef(currentRecordingPosition);

    const mChannelLayoutTextSize = 32;
    const mChannelLayoutEventTextSize = 26;
    const mChannelLayoutNumberTextSize = 38;
    const mChannelLayoutTextColor = '#cccccc';
    const mChannelLayoutTitleTextColor = '#969696';
    const mChannelLayoutMargin = 3;
    const mChannelLayoutPadding = 7;
    const mChannelLayoutHeight = 90;
    const mChannelLayoutWidth = 900;
    const mChannelLayoutBackgroundFocus = 'rgba(65,182,230,1)';

    const [state, setState] = useState<State>(State.DETAILS);
    const [detailsState, setDetailsState] = useState<DetailsState>();

    const getTopFrom = (position: number) => {
        const y = position * mChannelLayoutHeight; //+ this.mChannelLayoutMargin;
        return y - scrollY.current;
    };

    const scrollToChannelPosition = (channelPosition: number, withAnimation: boolean) => {
        // start scrolling after padding position top
        if (
            channelPosition < VERTICAL_SCROLL_TOP_PADDING_ITEM ||
            props.recordings.length <= getLastVisibleChannelPosition() - getFirstVisibleChannelPosition()
        ) {
            scrollY.current = 0;
            updateCanvas();
            return;
        }

        // stop scrolling before top padding position
        const maxPosition = props.recordings.length - VERTICAL_SCROLL_TOP_PADDING_ITEM;
        if (channelPosition >= maxPosition) {
            // fix scroll to channel in case it is within bottom padding
            if (scrollY.current === 0) {
                scrollY.current = mChannelLayoutHeight * (maxPosition - VERTICAL_SCROLL_TOP_PADDING_ITEM);
            }
            updateCanvas();
            return;
        }

        // scroll to channel position
        const scrollTarget = mChannelLayoutHeight * (channelPosition - VERTICAL_SCROLL_TOP_PADDING_ITEM);
        if (!withAnimation) {
            scrollY.current = scrollTarget;
            updateCanvas();
            return;
        }

        const scrollDistance = scrollTarget - scrollY.current;
        const scrollDelta = scrollDistance / (mChannelLayoutHeight / 5);
        // stop existing animation if we have a new request
        cancelAnimationFrame(scrollAnimationId.current);
        scrollAnimationId.current = requestAnimationFrame(() => {
            animateScroll(scrollDelta, scrollTarget);
        });
    };

    const animateScroll = (scrollDelta: number, scrollTarget: number) => {
        if (scrollDelta < 0 && scrollY.current <= scrollTarget) {
            //this.scrollY = scrollTarget;
            cancelAnimationFrame(scrollAnimationId.current);
            return;
        }
        if (scrollDelta > 0 && scrollY.current >= scrollTarget) {
            //this.scrollY = scrollTarget;
            cancelAnimationFrame(scrollAnimationId.current);
            return;
        }
        //console.log("scrolldelta=%d, scrolltarget=%d, scrollY=%d", scrollDelta, scrollTarget, this.scrollY);
        scrollY.current = scrollY.current + scrollDelta;
        scrollAnimationId.current = requestAnimationFrame(() => {
            animateScroll(scrollDelta, scrollTarget);
        });
        updateCanvas();
    };

    const drawChannelListItems = (canvas: CanvasRenderingContext2D) => {
        // Background
        const drawingRect = new Rect();
        drawingRect.left = 0;
        drawingRect.top = 0;
        drawingRect.right = drawingRect.left + mChannelLayoutWidth;
        drawingRect.bottom = drawingRect.top + getHeight();
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

        const firstPos = getFirstVisibleChannelPosition();
        const lastPos = getLastVisibleChannelPosition();

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
            drawChannelItem(canvas, pos);
        }
    };

    const drawChannelItem = (canvas: CanvasRenderingContext2D, position: number) => {
        const isSelectedChannel = position === recordPosition.current;
        const channel = props.recordings[position];
        const drawingRect = new Rect();

        // should not happen, but better check it
        if (!channel) return;

        drawingRect.left = 0;
        drawingRect.top = getTopFrom(position);
        drawingRect.right = mChannelLayoutWidth;
        drawingRect.bottom = drawingRect.top + mChannelLayoutHeight;
        IS_DEBUG && CanvasUtils.drawDebugRect(canvas, drawingRect);

        // highlight selected channel
        if (isSelectedChannel) {
            canvas.fillStyle = mChannelLayoutBackgroundFocus;
            canvas.fillRect(drawingRect.left, drawingRect.top, drawingRect.width, drawingRect.height);
        }

        // channel number
        CanvasUtils.writeText(canvas, channel.getChannelID().toString(), drawingRect.left + 70, drawingRect.middle, {
            fontSize: mChannelLayoutNumberTextSize,
            textAlign: 'right',
            fillStyle: mChannelLayoutTextColor,
            isBold: true
        });

        // channel line
        const currentEvent = channel.getEvents()[0];
        const channelIconWidth = mChannelLayoutHeight * 1.3;
        const channelNameWidth = mChannelLayoutWidth - channelIconWidth - 90;
        const leftBeforeRecMark = drawingRect.left;

        let fillStyle = mChannelLayoutTextColor;
        switch (channel.getKind()) {
            case 'REC_FAILED':
                fillStyle = '#EF3343';
                break;
            case 'REC_UPCOMING':
                fillStyle = '#555555';
                break;
        }

        // channel event
        if (currentEvent) {
            // recording mark
            if (currentEvent && channel.getKind() === 'REC_UPCOMING' && currentEvent.getStart() < EPGUtils.getNow()) {
                const radius = 10;
                canvas.fillStyle = '#FF0000';
                canvas.beginPath();
                canvas.arc(drawingRect.left + 90 + radius, drawingRect.middle - radius, radius, 0, 2 * Math.PI);
                canvas.fill();
                drawingRect.left += 2 * radius + mChannelLayoutPadding;
            }

            // channel name
            CanvasUtils.writeText(
                canvas,
                currentEvent.getTitle(),
                drawingRect.left + 90,
                drawingRect.top + mChannelLayoutHeight * 0.33,
                {
                    fontSize: mChannelLayoutTextSize,
                    fillStyle: fillStyle,
                    isBold: true,
                    maxWidth: channelNameWidth
                }
            );

            drawingRect.left = leftBeforeRecMark;
            // channel event progress bar
            const channelEventProgressRect = new Rect();
            channelEventProgressRect.left = drawingRect.left + 90;
            channelEventProgressRect.right = channelEventProgressRect.left + 80;
            channelEventProgressRect.top = drawingRect.top + mChannelLayoutHeight * 0.66;
            channelEventProgressRect.bottom = channelEventProgressRect.top + mChannelLayoutEventTextSize * 0.5;
            canvas.strokeStyle = mChannelLayoutTextColor;
            canvas.strokeRect(
                channelEventProgressRect.left,
                channelEventProgressRect.top,
                channelEventProgressRect.width,
                channelEventProgressRect.height
            );
            canvas.fillStyle = isSelectedChannel ? mChannelLayoutTextColor : mChannelLayoutTitleTextColor;
            canvas.fillRect(
                channelEventProgressRect.left + 2,
                channelEventProgressRect.top + 2,
                (channelEventProgressRect.width - 4) * currentEvent.getDoneFactor(),
                channelEventProgressRect.height - 4
            );

            // channel event text
            const channelEventWidth = mChannelLayoutWidth - channelIconWidth - 90 - channelEventProgressRect.width;
            CanvasUtils.writeText(
                canvas,
                currentEvent.getSubTitle(),
                channelEventProgressRect.right + mChannelLayoutPadding,
                channelEventProgressRect.middle,
                {
                    fontSize: mChannelLayoutEventTextSize,
                    fillStyle: canvas.fillStyle,
                    maxWidth: channelEventWidth
                }
            );
        }

        // channel logo
        const imageURL = channel.getImageURL();
        const image = imageURL && imageCache.get(imageURL);
        if (image !== undefined) {
            const channelImageRect = getDrawingRectForChannelImage(position, image);
            canvas.drawImage(
                image,
                channelImageRect.left,
                channelImageRect.top,
                channelImageRect.width,
                channelImageRect.height
            );
            IS_DEBUG && CanvasUtils.drawDebugRect(canvas, channelImageRect);
        }
    };

    const getDrawingRectForChannelImage = (position: number, image: HTMLImageElement) => {
        const drawingRect = new Rect();
        drawingRect.right = mChannelLayoutWidth - mChannelLayoutMargin;
        drawingRect.left = drawingRect.right - mChannelLayoutHeight * 1.3;
        drawingRect.top = getTopFrom(position);
        drawingRect.bottom = drawingRect.top + mChannelLayoutHeight;

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

    /**
     * get first visible channel position
     */
    const getFirstVisibleChannelPosition = () => {
        const y = scrollY.current;
        let position = Math.floor(y / mChannelLayoutHeight);

        if (position < 0) {
            position = 0;
        }
        //console.log("First visible item: ", position);
        return position;
    };

    const getLastVisibleChannelPosition = () => {
        const y = scrollY.current;
        const screenHeight = getHeight();
        let position = Math.floor((y + screenHeight) / mChannelLayoutHeight);

        const channelCount = props.recordings.length;
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
    };

    const recalculateAndRedraw = (withAnimation: boolean) => {
        if (props.recordings !== null && props.recordings.length > 0) {
            // calculateMaxVerticalScroll();
            scrollToChannelPosition(recordPosition.current, withAnimation);
        }
    };

    const getWidth = () => {
        return mChannelLayoutWidth;
    };

    const getHeight = () => {
        return window.innerHeight;
    };

    const focus = () => {
        listWrapper.current?.focus();
    };

    const handleKeyPress = (event: React.KeyboardEvent<HTMLDivElement>) => {
        const keyCode = event.keyCode;

        if (state === State.DELETE_DIALOG || state === State.CANCEL_DIALOG) {
            return event;
        }

        switch (keyCode) {
            case 33: // programm up
            case 38: // arrow up
                event.stopPropagation();
                scrollUp();
                break;
            case 34: // programm down
            case 40: // arrow down
                event.stopPropagation();
                scrollDown();
                break;
            case 404: // TODO yellow button + back button
            case 67: // keyboard 'c'
            case 461: // back button
                event.stopPropagation();
                props.unmount();
                break;
            case 13: // ok button -> switch to focused channel
                event.stopPropagation();
                setCurrentRecordingPosition(recordPosition.current);
                props.unmount();
                break;
            case 82: // keyboard 'r'
            case 403: {
                // red button to trigger or cancel recording
                event.stopPropagation();
                if (detailsState?.focusedEvent) {
                    if (detailsState?.focusedChannelRecording?.getKind() === 'REC_UPCOMING') {
                        // show cancel dialog
                        setState(State.CANCEL_DIALOG);
                    } else {
                        // show delete dialog
                        setState(State.DELETE_DIALOG);
                    }
                }
                break;
            }
            default:
                console.log('RecordingList-keyPressed:', keyCode);
        }

        // pass unhandled events to parent
        if (!event.isPropagationStopped) return event;
    };

    const deleteRecording = (event: EPGEvent | undefined) => {
        if (!event) {
            return;
        }
        props.deleteRecording(event);
        setState(State.DETAILS);
        focus();
    };

    const cancelRecording = (event: EPGEvent | undefined) => {
        if (!event) {
            return;
        }
        props.cancelRecording(event);
        setState(State.DETAILS);
        focus();
    };

    const setDetailsData = () => {
        const channel = props.recordings[recordPosition.current];
        // get current event
        const currentEvent = channel.getEvents()[0];
        // trigger rerender
        setDetailsState({
            focusedEvent: currentEvent,
            focusedChannelRecording: channel
        });
    };

    const handleScrollWheel = (event: React.WheelEvent<HTMLDivElement>) => {
        event.deltaY < 0 ? scrollUp() : scrollDown();
        focus();
    };

    const handleClick = () => {
        setCurrentRecordingPosition(recordPosition.current);
        props.unmount();
    };

    const scrollUp = () => {
        // if we reached 0 we scroll to end of list
        if (recordPosition.current === 0) {
            setChannelPosition(props.recordings.length - 1);
        } else {
            // channel down
            setChannelPosition(recordPosition.current - 1);
        }
    };

    const scrollDown = () => {
        // when channel position increased channelcount we scroll to beginning
        if (recordPosition.current === props.recordings.length - 1) {
            setChannelPosition(0);
        } else {
            // channel up
            setChannelPosition(recordPosition.current + 1);
        }
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
        if (props.recordings && props.recordings.length > 0) {
            drawChannelListItems(canvas);
        }
    };

    const setChannelPosition = (channelPos: number) => {
        recordPosition.current = channelPos;
        if (state === State.DETAILS) {
            setDetailsData();
        }
        scrollToChannelPosition(channelPos, true);
    };

    useEffect(() => {
        // callback: update canvas after recordings have been reloaded
        updateCanvas();
    }, [props.recordings]);

    useEffect(() => {
        recalculateAndRedraw(false);
        if (currentRecordingPosition > -1) {
            setChannelPosition(currentRecordingPosition);
        }
        focus();

        return () => {
            // stop animation when unmounting
            cancelAnimationFrame(scrollAnimationId.current);
        };
    }, []);

    return (
        <div
            id="recordinglist-wrapper"
            ref={listWrapper}
            tabIndex={-1}
            onKeyDown={handleKeyPress}
            onWheel={handleScrollWheel}
            onClick={handleClick}
            className="channelList"
        >
            <canvas ref={canvas} width={getWidth()} height={getHeight()} style={{ display: 'block' }} />

            <ChannelListDetails
                isRecording={() => {
                    return false;
                }}
                epgChannel={detailsState?.focusedChannelRecording}
                currentEvent={detailsState?.focusedEvent}
                nextEvents={[]}
                nextSameEvents={[]}
            />

            {state === State.DELETE_DIALOG && detailsState?.focusedEvent && (
                <DialogPopup
                    title={detailsState.focusedEvent.getTitle()}
                    subtitle={detailsState.focusedEvent.getTitle() + ' - ' + detailsState.focusedEvent.getSubTitle()}
                    confirmText="Delete"
                    abortText="Abort"
                    confirmAction={() => deleteRecording(detailsState.focusedEvent)}
                    abortAcion={() => {
                        setState(State.DETAILS);
                        focus();
                    }}
                ></DialogPopup>
            )}

            {state === State.CANCEL_DIALOG && detailsState?.focusedEvent && (
                <DialogPopup
                    title={detailsState.focusedEvent.getTitle()}
                    subtitle={detailsState.focusedEvent.getTitle() + ' - ' + detailsState.focusedEvent.getSubTitle()}
                    confirmText="Cancel"
                    abortText="Abort"
                    confirmAction={() => cancelRecording(detailsState.focusedEvent)}
                    abortAcion={() => {
                        setState(State.DETAILS);
                        focus();
                    }}
                ></DialogPopup>
            )}
        </div>
    );
};

export default RecordingList;
