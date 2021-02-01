import React, { useEffect, useRef } from 'react';
import CanvasUtils from '../utils/CanvasUtils';
import '../styles/app.css';

const HEADER_HEIGHT = 130;
const HEADER_TEXT_SIZE = 90;

const ChannelHeader = (props: { channelNumberText: string; unmount: () => void }) => {
    const canvas = useRef<HTMLCanvasElement>(null);
    const timeoutReference = useRef<NodeJS.Timeout | null>(null);
    const canvasUtils = new CanvasUtils();

    const drawChannelNumber = (canvas: CanvasRenderingContext2D) => {
        // create gradient for text
        const gradient = canvas.createLinearGradient(0, 20, 0, HEADER_TEXT_SIZE + 20);
        gradient.addColorStop(0, 'rgba(200, 200, 200, 1)');
        gradient.addColorStop(0.5, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(1, 'rgba(200, 200, 200, 1)');

        // draw text
        canvasUtils.writeText(canvas, props.channelNumberText, getWidth() - 20, HEADER_TEXT_SIZE / 2 + 20, {
            fontSize: HEADER_TEXT_SIZE,
            fillStyle: gradient,
            textAlign: 'right'
        });
    };

    const getWidth = () => {
        return window.innerWidth;
    };

    const getHeight = () => {
        return HEADER_HEIGHT;
    };

    /** set timeout to automatically unmount */
    const resetUnmountTimeout = () => {
        timeoutReference.current && clearTimeout(timeoutReference.current);
        timeoutReference.current = setTimeout(() => props.unmount(), 5000);
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
        drawChannelNumber(canvas);
    };

    useEffect(() => {
        return () => {
            // clear timeout in case component is unmounted
            timeoutReference.current && clearTimeout(timeoutReference.current);
        };
    }, []);

    useEffect(() => {
        resetUnmountTimeout();
        updateCanvas();
    }, [props.channelNumberText]);

    return (
        <div id="channelheader-wrapper" tabIndex={-1} className="channelHeader">
            <canvas ref={canvas} width={getWidth()} height={getHeight()} style={{ display: 'block' }} />
        </div>
    );
};

export default ChannelHeader;
