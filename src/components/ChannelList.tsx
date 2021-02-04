import React, { useContext, useEffect, useRef, useState } from 'react';
import Rect from '../models/Rect';
import CanvasUtils from '../utils/CanvasUtils';
import AppContext from '../AppContext';
import '../styles/app.css';
import ChannelListDetails from './ChannelListDetails';
import EPGEvent from '../models/EPGEvent';
import EPGChannel from '../models/EPGChannel';
import EPGUtils from '../utils/EPGUtils';

const VERTICAL_SCROLL_TOP_PADDING_ITEM = 5;
const IS_DEBUG = false;

enum State {
    NORMAL = 'normal',
    DETAILS = 'details'
}

interface DetailsState {
    focusedChannel?: EPGChannel;
    focusedEvent?: EPGEvent;
}

const ChannelList = (props: {
    toggleRecording: (event: EPGEvent, callback: () => any) => void;
    unmount: () => void;
}) => {
    const { epgData, imageCache, currentChannelPosition, setCurrentChannelPosition } = useContext(AppContext);
    const canvas = useRef<HTMLCanvasElement>(null);
    const listWrapper = useRef<HTMLDivElement>(null);
    const scrollAnimationId = useRef(0);
    const scrollY = useRef(0);
    const channelPosition = useRef(currentChannelPosition);

    // details refs
    const [detailsState, setDetailsState] = useState<DetailsState>();

    const focusedEventOffset = useRef(0);
    const nextEvents = useRef<EPGEvent[]>([]);
    const nextSameEvents = useRef<EPGEvent[]>([]);

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

    const [state, setState] = useState<State>(State.NORMAL);

    const getTopFrom = (position: number) => {
        const y = position * mChannelLayoutHeight; //+ this.mChannelLayoutMargin;
        return y - scrollY.current;
    };

    const scrollToChannelPosition = (channelPosition: number, withAnimation: boolean) => {
        // start scrolling after padding position top
        if (channelPosition < VERTICAL_SCROLL_TOP_PADDING_ITEM) {
            scrollY.current = 0;
            updateCanvas();
            return;
        }

        // stop scrolling before top padding position
        const maxPosition = epgData.getChannelCount() - VERTICAL_SCROLL_TOP_PADDING_ITEM;
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
        const isSelectedChannel = position === channelPosition.current;
        const channel = epgData.getChannel(position);
        const drawingRect = new Rect();

        // should not happen, but better check it
        if (!channel) return;

        drawingRect.left = 0;
        drawingRect.top = getTopFrom(position);
        drawingRect.right = mChannelLayoutWidth;
        drawingRect.bottom = drawingRect.top + mChannelLayoutHeight;
        drawDebugRect(canvas, drawingRect);

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
        const currentEvent = epgData.getEventAtTimestamp(position, EPGUtils.getNow());
        const channelIconWidth = mChannelLayoutHeight * 1.3;
        const channelNameWidth = mChannelLayoutWidth - channelIconWidth - 90;

        const leftBeforeRecMark = drawingRect.left;
        // recording mark
        if (currentEvent && epgData.isRecording(currentEvent)) {
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
            channel.getName(),
            drawingRect.left + 90,
            drawingRect.top + mChannelLayoutHeight * 0.33,
            {
                fontSize: mChannelLayoutTextSize,
                fillStyle: mChannelLayoutTextColor,
                isBold: true,
                maxWidth: channelNameWidth
            }
        );
        drawingRect.left = leftBeforeRecMark;

        // channel event
        channel.getEvents().forEach((event) => {
            if (event.isCurrent()) {
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
                    (channelEventProgressRect.width - 4) * event.getDoneFactor(),
                    channelEventProgressRect.height - 4
                );

                // channel event text
                const channelEventWidth = mChannelLayoutWidth - channelIconWidth - 90 - channelEventProgressRect.width;
                CanvasUtils.writeText(
                    canvas,
                    event.getTitle(),
                    channelEventProgressRect.right + mChannelLayoutPadding,
                    channelEventProgressRect.middle,
                    {
                        fontSize: mChannelLayoutEventTextSize,
                        fillStyle: canvas.fillStyle,
                        maxWidth: channelEventWidth
                    }
                );
            }
        });

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
            drawDebugRect(canvas, channelImageRect);
        }
    };

    const drawDebugRect = (canvas: CanvasRenderingContext2D, drawingRect: Rect) => {
        if (IS_DEBUG) {
            canvas.strokeStyle = '#FF0000';
            canvas.strokeRect(drawingRect.left, drawingRect.top, drawingRect.width, drawingRect.height);
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

        const channelCount = epgData.getChannelCount();
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
        if (epgData !== null && epgData.hasData()) {
            // calculateMaxVerticalScroll();
            scrollToChannelPosition(channelPosition.current, withAnimation);
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
                setCurrentChannelPosition(channelPosition.current);
                props.unmount();
                break;
            case 403: {
                // red button trigger recording
                event.stopPropagation();
                toggleRecording();
                break;
            }
            case 39: // right arrow
                event.stopPropagation();
                if (state === State.DETAILS) {
                    // switch to next event details
                    focusedEventOffset.current += 1;
                    setDetailsData();
                } else {
                    // show channelListDetails
                    setState(State.DETAILS);
                }
                break;
            case 37: // left arrow
                event.stopPropagation();
                if (state === State.DETAILS && focusedEventOffset.current > 0) {
                    // switch to previous event details
                    focusedEventOffset.current -= 1;
                    setDetailsData();
                } else {
                    // hide channelListDetails
                    setState(State.NORMAL);
                }
                break;
            default:
                console.log('ChannelList-keyPressed:', keyCode);
        }

        // pass unhandled events to parent
        if (!event.isPropagationStopped) return event;
    };

    const toggleRecording = () => {
        const epgEvent =
            detailsState?.focusedEvent ||
            epgData
                .getChannel(channelPosition.current)
                ?.getEvents()
                .find((e) => e.isCurrent());
        if (epgEvent) {
            // call passed toggle recording function
            props.toggleRecording(epgEvent, () => {
                updateCanvas();
                // trigger rerender
                setDetailsState({ ...detailsState });
            });
        }
    };

    const handleScrollWheel = (event: React.WheelEvent<HTMLDivElement>) => {
        event.deltaY < 0 ? scrollUp() : scrollDown();
        focus();
    };

    const handleClick = () => {
        setCurrentChannelPosition(channelPosition.current);
        props.unmount();
    };

    const scrollUp = () => {
        // if we reached 0 we scroll to end of list
        if (channelPosition.current === 0) {
            setChannelPosition(epgData.getChannelCount() - 1);
        } else {
            // channel down
            setChannelPosition(channelPosition.current - 1);
        }
    };

    const scrollDown = () => {
        // when channel position increased channelcount we scroll to beginning
        if (channelPosition.current === epgData.getChannelCount() - 1) {
            setChannelPosition(0);
        } else {
            // channel up
            setChannelPosition(channelPosition.current + 1);
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
        if (epgData && epgData.hasData()) {
            drawChannelListItems(canvas);
        }
    };

    const setChannelPosition = (channelPos: number) => {
        channelPosition.current = channelPos;
        if (state === State.DETAILS) {
            setDetailsData();
        }
        scrollToChannelPosition(channelPos, true);
    };

    const setDetailsData = () => {
        const channel = epgData.getChannel(channelPosition.current);
        // in case channel changed
        if (channel?.getChannelID() !== detailsState?.focusedChannel?.getChannelID()) {
            focusedEventOffset.current = 0;
        }
        // get current event
        const currentEvent = epgData.getEventAtTimestamp(channelPosition.current, EPGUtils.getNow()) || undefined;
        let newFocusedEvent = null;
        if (currentEvent) {
            // get next event position with offset
            const eventPos =
                epgData.getEventPosition(channelPosition.current, currentEvent) + focusedEventOffset.current;
            const nextEventsArray: EPGEvent[] = [];
            for (let i = eventPos; i < eventPos + 5; i++) {
                const nextEvent = epgData.getEvent(channelPosition.current, i + 1);
                nextEvent && nextEventsArray.push(nextEvent);
            }
            nextEvents.current = nextEventsArray;
            // get same

            // set event with offset
            newFocusedEvent = epgData.getEvent(channelPosition.current, eventPos);
        } else {
            nextEvents.current = [];
            nextSameEvents.current = [];
        }

        // trigger rerender
        setDetailsState({
            focusedEvent: newFocusedEvent || undefined,
            focusedChannel: channel || undefined
        });
    };

    useEffect(() => {
        recalculateAndRedraw(false);
        focus();

        return () => {
            // stop animation when unmounting
            cancelAnimationFrame(scrollAnimationId.current);
        };
    }, []);

    useEffect(() => {
        if (state === State.DETAILS) {
            setDetailsData();
        }
    }, [state]);

    return (
        <div
            id="channellist-wrapper"
            ref={listWrapper}
            tabIndex={-1}
            onKeyDown={handleKeyPress}
            onWheel={handleScrollWheel}
            onClick={handleClick}
            className="channelList"
        >
            <canvas ref={canvas} width={getWidth()} height={getHeight()} style={{ display: 'block' }} />

            {state === State.DETAILS && (
                <ChannelListDetails
                    isRecording={(event: EPGEvent) => {
                        return epgData.isRecording(event);
                    }}
                    epgChannel={detailsState?.focusedChannel}
                    currentEvent={detailsState?.focusedEvent}
                    nextEvents={nextEvents.current}
                    nextSameEvents={nextSameEvents.current}
                />
            )}
        </div>
    );
};

export default ChannelList;
