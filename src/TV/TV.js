
import React, { Component } from 'react';

import ReactDOM from "react-dom";
import Styles from '../EPG/styles/app.css';

export default class TV extends Component {

    constructor(props) {
        super(props);

        this.showEpgHandler = props.showEpgHandler;
        this.handleKeyPress = this.handleKeyPress.bind(this);
        this.epgData = props.epgData;
        this.imageCache = props.imageCache;
        this.channelPosition = 0;
    }

    componentDidMount() {
        this.initVideoElement();
        // in case we come back from epg
        if (this.epgData.getChannelCount() > 0 && !this.getMediaElement().hasChildNodes()) {
            this.changeSource(this.epgData.getChannel(this.channelPosition).getStreamUrl());
        }
        this.setFocus();
    }

    componentDidUpdate(prevProps) {
        /*
         * if video doesn't have a source yet - we set it
         * this normally happens when the epg is loaded
         */
        if (this.epgData.getChannelCount() > 0 && !this.getMediaElement().hasChildNodes()) {
            this.changeSource(this.epgData.getChannel(this.channelPosition).getStreamUrl());
        }

        //this.setFocus();
    }

    setFocus() {
        ReactDOM.findDOMNode(this.refs.video).focus();
    }

    handleKeyPress(event) {
        let keyCode = event.keyCode;

        switch (keyCode) {
            case 40:
                // channel down
                if (this.channelPosition === 0) {
                    return
                }
                this.channelPosition -= 1;
                this.changeChannelPosition(this.channelPosition);
                break;
            case 38:
                // channel up
                if (this.channelPosition === this.epgData.getChannelCount() - 1) {
                    return;
                }
                this.channelPosition += 1;
                this.changeChannelPosition(this.channelPosition);
                break;
            case 404: // green button show epg
            case 71: // keyboard 'g'
                this.showEpgHandler(this.channelPosition);
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
        return ReactDOM.findDOMNode(this.refs.media);
    }

    changeChannelPosition(channelPosition) {
        if(this.channelPosition === channelPosition) {
            return;
        }
        this.channelPosition = channelPosition;
        this.changeSource(this.epgData.getChannel(channelPosition).getStreamUrl());
    }

    initVideoElement() {
        var videoElement = this.getMediaElement();
        videoElement.addEventListener("loadedmetadata", event => {
            console.log(JSON.stringify(event));
            //console.log("Text Tracks: ", JSON.stringify(videoElement.textTracks));
            //console.log("Audio Tracks: ", JSON.stringify(videoElement.sourceBuffer.audioTracks));
        });
        // videoElement.audioTracks.addEventListener("addtrack", event => {
        //     //console.log(JSON.stringify(event));
        //     console.log("add Track: ", JSON.stringify(event));
        // });
        
    
        // TODO audioTracklist
        // TODO subtitleList
    }

    changeSource(dataUrl) {
        var videoElement = this.getMediaElement();

        // Remove all source elements
        while (videoElement.firstChild) {
            videoElement.removeChild(videoElement.firstChild);
        }

        // Initiating readyState of HTMLMediaElement
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
            <div id="tv-wrapper" ref="video" tabIndex='-1' onKeyDown={this.handleKeyPress} className={Styles.tv}>
                <video id="myVideo" ref="media" width="100%" height="100%" controls preload autoplay></video>
            </div> 
        );
    }
}