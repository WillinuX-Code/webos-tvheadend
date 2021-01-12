import React, { Component } from 'react';
import '../styles/app.css';
import CanvasUtils from '../utils/CanvasUtils';

export default class ChannelHeader extends Component {

    constructor(props) {
        super(props);

        this.canvas = React.createRef();
        this.stateUpdateHandler = this.props.stateUpdateHandler;
        this.channelNumberText = this.props.channelNumberText;
        this.canvasUtils = new CanvasUtils();
        this.timeoutReference = {};
        this.intervalReference = {};

        this.mChannelHeaderHeight = 80;
        this.mChannelHeaderTextSize = 56;
    }

    updateChannelNumberText(numberText) {
        this.channelNumberText = numberText;
        this.resetUnmountTimeout();
    }

    drawChannelNumber() {
        // draw shadow
        this.canvasUtils.writeText(this.ctx, this.channelNumberText, this.mChannelHeaderHeight - 3, this.mChannelHeaderTextSize / 2 + 3, {
            fontSize: this.mChannelHeaderTextSize,
            fillStyle: '#363636',
            textAlign: 'right'
        });

        // draw text
        this.canvasUtils.writeText(this.ctx, this.channelNumberText, this.mChannelHeaderHeight, this.mChannelHeaderTextSize / 2, {
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

    componentDidUpdate(prevProps) {
        this.updateCanvas();
    }

    componentWillUnmount() {
        clearInterval(this.timeoutReference);
        clearInterval(this.intervalReference);
    }

    updateCanvas() {
        // clear
        this.ctx = this.canvas.current.getContext('2d');
        this.ctx.clearRect(0, 0, this.getWidth(), this.getHeight());

        // draw children “components”
        this.onDraw()
    }

    onDraw() {
        this.drawChannelNumber(this.channelNumberText);
    }

    render() {
        return (
            <div id="channelheader-wrapper" tabIndex="-1" className="channelHeader">
                <canvas ref={this.canvas} width={this.getWidth()} height={this.getHeight()} style={{ display: 'block' }} />
            </div>
        );
    }
}