import React, { Component } from 'react';
import '../styles/app.css';
import CanvasUtils from '../utils/CanvasUtils';

export default class ChannelHeader2 extends Component {
    
    private canvas: React.RefObject<HTMLCanvasElement>;
    private stateUpdateHandler: any;
    private channelNumberText: string;
    private canvasUtils: CanvasUtils;
    private timeoutReference?: NodeJS.Timeout;
    private intervalReference?: NodeJS.Timeout;

    mChannelHeaderHeight = 80;
    mChannelHeaderTextSize = 56;

    constructor(public props: Readonly<any>) {
        super(props);

        this.canvas = React.createRef();
        this.stateUpdateHandler = props.stateUpdateHandler;
        this.channelNumberText = props.channelNumberText;
        this.canvasUtils = new CanvasUtils();

        this.mChannelHeaderHeight = 80;
        this.mChannelHeaderTextSize = 56;
    }

    updateChannelNumberText(numberText: string) {
        this.channelNumberText = numberText;
        this.resetUnmountTimeout();
    }

    drawChannelNumber(canvas: CanvasRenderingContext2D) {
        // draw shadow
        this.canvasUtils.writeText(canvas, this.channelNumberText, this.mChannelHeaderHeight - 3, this.mChannelHeaderTextSize / 2 + 3, {
            fontSize: this.mChannelHeaderTextSize,
            fillStyle: '#363636',
            textAlign: 'right'
        });

        // draw text
        this.canvasUtils.writeText(canvas, this.channelNumberText, this.mChannelHeaderHeight, this.mChannelHeaderTextSize / 2, {
            fontSize: this.mChannelHeaderTextSize,
            fillStyle: '#D6D6D6',
            textAlign: 'right'
        });
    }

    getWidth() {
        return window.innerWidth;
    }

    getHeight() {
        return this.mChannelHeaderHeight;
    }

    /** set timeout to automatically unmount */
    resetUnmountTimeout() {
        this.timeoutReference = setTimeout(() => this.stateUpdateHandler({
            channelNumberText: ''
        }), 5000);
    }

    componentDidMount() {
        this.updateCanvas();
        this.resetUnmountTimeout();
        this.intervalReference = setInterval(() => this.updateCanvas(), 500);
    }

    componentDidUpdate(prevProps: any) {
        this.updateCanvas();
    }

    componentWillUnmount() {
        this.timeoutReference && clearInterval(this.timeoutReference);
        this.intervalReference && clearInterval(this.intervalReference);
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
        this.drawChannelNumber(canvas);
    }

    render() {
        return (
            <div id="channelheader-wrapper" tabIndex={-1} className="channelHeader2">
                <canvas ref={this.canvas} width={this.getWidth()} height={this.getHeight()} style={{ display: 'block' }} />
            </div>
        );
    }
}