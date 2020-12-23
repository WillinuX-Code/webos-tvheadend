import React, { Component } from 'react';
import ChannelInfo from './ChannelInfo';
import '../styles/app.css';

export default class TV extends Component {

    constructor(props) {
        super(props);

        this.state = {
            isInfoState: true,
            channelPosition: 0
        }
        this.showChannelListHandler = props.showChannelListHandler;
        this.showEpgHandler = props.showEpgHandler;
        this.showChannelInfoHandler = props.showChannelInfoHandler;
        this.handleKeyPress = this.handleKeyPress.bind(this);
        this.unmountInfo = this.unmountInfo.bind(this);
        this.epgData = props.epgData;
        this.imageCache = props.imageCache;
    }

    componentDidMount() {
        // init video element
        this.initVideoElement();
        // in case we come back from epg
        if (this.epgData.getChannelCount() > 0 && !this.getMediaElement().hasChildNodes()) {
            this.changeSource(this.epgData.getChannel(this.state.channelPosition).getStreamUrl());
        }
        this.focus();
    }
    getWidth() {
        return window.innerWidth;
    }

    getHeight() {
        return window.innerHeight;
    }

    componentDidUpdate(prevProps) {
        /*
         * if video doesn't have a source yet - we set it
         * this normally happens when the epg is loaded
         */
        if (this.epgData.getChannelCount() > 0 && !this.getMediaElement().hasChildNodes()) {
            this.changeSource(this.epgData.getChannel(this.state.channelPosition).getStreamUrl());
        }

        //this.setFocus();
    }

    unmountInfo() {
        this.focus();
        this.setState((state, props) => ({
            isInfoState: false
        }));
    }

    focus() {
        this.refs.video.focus();
    }

    handleKeyPress(event) {
        let keyCode = event.keyCode;
        let channelPosition = this.state.channelPosition;
        switch (keyCode) {
            case 34: // programm down
                // channel down
                if (channelPosition === 0) {
                    return
                }
                channelPosition -= 1;
                this.changeChannelPosition(channelPosition);
                break;
            case 40: // arrow down
                this.showChannelListHandler(channelPosition);
                break;
            case 33: // programm up
                // channel up
                if (channelPosition === this.epgData.getChannelCount() - 1) {
                    return;
                }
                channelPosition += 1;
                this.changeChannelPosition(channelPosition);
                break;
            case 67: // 'c'
            case 38: // arrow up
                this.showChannelListHandler(channelPosition);
                break;
            case 404: // green button show epg
            case 71: // keyboard 'g'
                this.showEpgHandler(channelPosition);
                break;
            case 13: // ok button ->show/disable channel info
                this.setState((state, props) => ({
                    isInfoState: !props.isInfoState
                }));
                if (!this.state.isInfoState) {
                    this.focus();
                }
                break;
            case 403: // red button trigger recording
                // add current viewing channel to records
                // red button to trigger or cancel recording
                // get current event
                // this.focusedEvent = this.epgData.getEvent(channelPosition, programPosition);
                // if (this.focusedEvent.isPastDated(this.getNow())) {
                //   // past dated do nothing
                //   return;
                // }
                // // check if event is already marked for recording
                // let recEvent = this.epgData.getRecording(this.focusedEvent);
                // if (recEvent) {
                //   // cancel recording
                //   this.tvhDataService.cancelRec(recEvent, recordings => {
                //     this.epgData.updateRecordings(recordings);
                //     this.updateCanvas();
                //   });
                // } else { // creat new recording from event
                //   this.tvhDataService.createRec(this.focusedEvent, recordings => {
                //     this.epgData.updateRecordings(recordings);
                //     this.updateCanvas();
                //   });
                // }
                break;
            default:
                console.log("TV-keyPressed:", keyCode);
        }
    };

    getMediaElement() {
        return document.getElementById("myVideo");
    }

    changeChannelPosition(channelPosition) {
        if (channelPosition === this.state.channelPosition) {
            return;
        }
        this.setState((state, props) => ( {
            channelPosition: channelPosition
        }))
        this.changeSource(this.epgData.getChannel(this.state.channelPosition).getStreamUrl());
    }

    initVideoElement() {
        var videoElement = this.getMediaElement();
        videoElement.addEventListener("loadedmetadata", event => {
            // console.log(JSON.stringify(event));
            console.log("Audio Tracks: ", videoElement.audioTracks);
            console.log("Video Tracks: ", videoElement.videoTracks);
            console.log("Text Tracks: ", videoElement.textTracks);
        });

        // TODO audioTracklist
        // TODO subtitleList
    }

    changeSource(dataUrl) {
        var videoElement = this.getMediaElement();

        // Remove all source elements
        while (videoElement.firstChild) {
            videoElement.removeChild(videoElement.firstChild);
        }
        // Initiating readyState of HTMLMediaElement to free resources 
        // after source elements have been removed
        videoElement.load();

        var options = {};
        options.mediaTransportType = "URI";
        //Convert the created object to JSON string and encode it.
        var mediaOption = encodeURI(JSON.stringify(options));
        // Add new source element
        var source = document.createElement("source");
        //Add attributes to the created source element for media content.
        source.setAttribute('src', dataUrl);
        source.setAttribute('type', 'video/mp2t;mediaOption=' + mediaOption);

        videoElement.appendChild(source)
        videoElement.play();
    }

    render() {
        return (
            <div id="tv-wrapper" ref="video" tabIndex='-1' onKeyDown={this.handleKeyPress} className="tv" >
                {this.state.isInfoState && <ChannelInfo ref="info" key={this.state.channelPosition} epgData={this.epgData}
                    imageCache={this.imageCache}
                    channelPosition={this.state.channelPosition}
                    parentHandleKeyPress={this.handleKeyPress}
                    unmountHandler={this.unmountInfo} />}

                <video id="myVideo" width={this.getWidth()} height={this.getHeight()} preload autoplay></video>
            </div>
        );
    }
}