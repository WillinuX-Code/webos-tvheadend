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

    mChannelHeaderHeight = 80;
    mChannelHeaderTextSize = 56;

    constructor(public props: Readonly<any>) {
        super(props);

        this.canvas = React.createRef();
        this.stateUpdateHandler = props.stateUpdateHandler;
        this.channelNumberText = props.channelNumberText;
        this.canvasUtils = new CanvasUtils();
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
        this.timeoutReference && clearTimeout(this.timeoutReference);
        this.timeoutReference = setTimeout(() => this.stateUpdateHandler({
            channelNumberText: ''
        }), 5000);
    }

    componentDidMount() {

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
            <div id="channelheader-wrapper" tabIndex={-1} className="channelHeader2">
                <canvas ref={this.canvas} width={this.getWidth()} height={this.getHeight()} style={{ display: 'block' }} />
            </div>
        );
    }
}