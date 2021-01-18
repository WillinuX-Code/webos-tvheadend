import React, { Component } from 'react';
import '../styles/app.css';
import CanvasUtils from '../utils/CanvasUtils';
import { StateUpdateHandler } from './TV';

export default class ChannelHeader extends Component {
    
    private canvas: React.RefObject<HTMLCanvasElement>;
    private stateUpdateHandler: StateUpdateHandler;
    private channelNumberText: string;
    private canvasUtils: CanvasUtils;
    private timeoutReference?: NodeJS.Timeout;

    private mChannelHeaderHeight = 80;
    private mChannelHeaderTextSize = 56;

    constructor(public props: Readonly<any>) {
        super(props);

        this.canvas = React.createRef();
        this.stateUpdateHandler = props.stateUpdateHandler;
        this.channelNumberText = props.channelNumberText;
        this.canvasUtils = new CanvasUtils();
    }

    drawChannelNumber(canvas: CanvasRenderingContext2D) {
        // create gradient for text 
        let gradient = canvas.createLinearGradient(0, 20, 0, this.mChannelHeaderTextSize + 20);
        gradient.addColorStop(0, 'rgba(200, 200, 200, 1)');
        gradient.addColorStop(0.5, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(1, 'rgba(200, 200, 200, 1)');

        // draw text
        this.canvasUtils.writeText(canvas, this.channelNumberText, this.getWidth() - 20, this.mChannelHeaderTextSize / 2 + 20, {
            fontSize: this.mChannelHeaderTextSize,
            fillStyle: gradient,
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
        this.timeoutReference && clearTimeout(this.timeoutReference);
        this.timeoutReference = setTimeout(() => this.stateUpdateHandler({
            channelNumberText: ''
        }), 5000);
    }

    componentDidMount() {
        this.channelNumberText = this.props.channelNumberText;
        this.resetUnmountTimeout();
        this.updateCanvas();
    }

    componentDidUpdate(prevProps: any, prevState: any) {
        this.channelNumberText = this.props.channelNumberText;
        this.resetUnmountTimeout();
        this.updateCanvas();
    }

    componentWillUnmount() {
        this.timeoutReference && clearTimeout(this.timeoutReference);
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
            <div id="channelheader-wrapper" tabIndex={-1} className="channelHeader">
                <canvas ref={this.canvas} width={this.getWidth()} height={this.getHeight()} style={{ display: "block" }} />
            </div>
        );
    }
}