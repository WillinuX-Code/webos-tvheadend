import React, { Component } from 'react';
import ChannelInfo from './ChannelInfo';
import TVGuide from './TVGuide';
import ChannelList from './ChannelList';
import ChannelSettings from './ChannelSettings';
import EPGUtils from '../utils/EPGUtils';
import '../styles/app.css';

export default class TV extends Component {

    static STORAGE_KEY_LAST_CHANNEL = "lastChannel";

    constructor(props) {
        super(props);

        this.state = {
            isChannelSettingsState: false,
            isInfoState: true,
            isEpgState: false,
            isChannelListState: false,
            channelPosition: 0,
            // audioTracks: [
            //     {enabled:true,id:1,language:"de"},
            //     {enabled:true,id:2,language:"mis"},
            //     {enabled:true,id:3,language:"mul"},
            //     {enabled:false,id:4,language:"en"},
            // ],
            audioTracks: [],
            textTracks: [],
        }
        this.handleKeyPress = this.handleKeyPress.bind(this);
        this.stateUpdateHandler = this.stateUpdateHandler.bind(this);

        this.tvhService = props.tvhService;
        this.epgData = props.epgData;
        this.epgUtils = new EPGUtils();
        this.imageCache = props.imageCache;
    }

    componentDidMount() {
        // read last channel position from storage
        let lastChannelPosition = localStorage.getItem(TV.STORAGE_KEY_LAST_CHANNEL);
        //console.log("Last Channel position:", lastChannelPosition);
        if(lastChannelPosition) {
            this.changeChannelPosition(parseInt(lastChannelPosition));
        }
        // init video element
        this.initVideoElement();
        this.focus();
    }
    getWidth() {
        return window.innerWidth;
    }

    getHeight() {
        return window.innerHeight;
    }

    getCurrentChannel() {
        return this.epgData.getChannel(this.state.channelPosition);
    }

    componentWillUnmount() {
        var videoElement = this.getMediaElement();
        // Remove all source elements
        while (videoElement.firstChild) {
            videoElement.removeChild(videoElement.firstChild);
        }
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        /*
         * if video doesn't have a source yet - we set it
         * this normally happens when the epg is loaded
         */
        // if (this.epgData.getChannelCount() > 0 && !this.getMediaElement().hasChildNodes()) {
        //     this.changeSource(this.epgData.getChannel(this.state.channelPosition).getStreamUrl());
        // }

        // change channel in case we have channels retrieved and channel position changed or we don't have a channel active
        if (this.epgData.getChannelCount() > 0 &&
            (prevState.channelPosition !== this.state.channelPosition || !this.getMediaElement().hasChildNodes())) {
            this.changeSource(this.getCurrentChannel().getStreamUrl());
        }

        // request focus if none of the other components are active
        if (!this.state.isInfoState
            && !this.state.isEpgState
            && !this.state.isChannelListState
            && !this.state.isChannelSettingsState) {
            this.focus();
        }
        //this.setFocus();
    }

    stateUpdateHandler(newState) {
        this.setState((state, props) => (newState));
    }

    focus() {
        if (this.refs.video) {
            this.refs.video.focus();
        }
    }

    handleKeyPress(event) {
        let keyCode = event.keyCode;
        let channelPosition = this.state.channelPosition;
        switch (keyCode) {
            case 34: // programm down
                event.stopPropagation();
                // channel down
                if (channelPosition === 0) {
                    return
                }
                channelPosition -= 1;
                this.changeChannelPosition(channelPosition);
                break;
            case 40: // arrow down
                event.stopPropagation();
                this.stateUpdateHandler({
                    isChannelListState: true,
                    isInfoState: false,
                    channelPosition: channelPosition
                });
                break;
            case 33: // programm up
                event.stopPropagation();
                // channel up
                if (channelPosition === this.epgData.getChannelCount() - 1) {
                    return;
                }
                channelPosition += 1;
                this.changeChannelPosition(channelPosition);
                break;
            case 67: // 'c'
            case 38: // arrow up
                event.stopPropagation();
                this.stateUpdateHandler({
                    isChannelListState: true,
                    isInfoState: false,
                    channelPosition: channelPosition
                });
                break;
            case 406: // blue button show epg
            case 66: // keyboard 'b'
                event.stopPropagation();
                this.stateUpdateHandler({
                    isEpgState: true,
                    channelPosition: channelPosition
                });
                break;
            case 13: // ok button ->show/disable channel info
                event.stopPropagation();
                // in channel settings state we dont process the ok - the channel settings component handles it
                if (this.state.isChannelSettingsState) {
                    break;
                }
                this.stateUpdateHandler({
                    isInfoState: !this.state.isInfoState
                });
                break;
            case 405: // yellow button 
            case 89: //'y'
                event.stopPropagation();
                this.stateUpdateHandler({
                    isChannelSettingsState: !this.state.isChannelSettingsState
                });
                break;
            case 403: // red button to trigger or cancel recording
                event.stopPropagation();
                // add current viewing channel to records
                // get current event
                let channel = this.getCurrentChannel()
                let epgEvent = {};
                for (let e of channel.getEvents()) {
                    if (e.isCurrent()) {
                        epgEvent = e;
                        break;
                    }
                };
                if (epgEvent.isPastDated(this.epgUtils.getNow())) {
                    // past dated do nothing
                    return;
                }
                // check if event is already marked for recording
                let recEvent = this.epgData.getRecording(epgEvent);
                if (recEvent) {
                    // cancel recording
                    this.tvhService.cancelRec(recEvent, recordings => {
                        this.epgData.updateRecordings(recordings);
                        this.updateCanvas();
                    });
                } else { // creat new recording from event
                    this.tvhService.createRec(epgEvent, recordings => {
                        this.epgData.updateRecordings(recordings);
                        this.updateCanvas();
                    });
                }
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
        this.setState((state, props) => ({
            isInfoState: true,
            channelPosition: channelPosition
        }));
        // store last used channel
        localStorage.setItem(TV.STORAGE_KEY_LAST_CHANNEL, channelPosition.toString());
    }

    initVideoElement() {
        var videoElement = this.getMediaElement();
        videoElement.addEventListener("loadedmetadata", event => {
            // console.log(JSON.stringify(event));
            console.log("Audio Tracks: ", videoElement.audioTracks);
            console.log("Video Tracks: ", videoElement.videoTracks);
            console.log("Text Tracks: ", videoElement.textTracks);
            // restore selected audio channel from storage
            let indexStr = localStorage.getItem(this.getCurrentChannel().getName());
            if (indexStr !== undefined) {
                let index = parseInt(indexStr);
                console.log("restore index %d for channel %s", index, this.getCurrentChannel().getName());
                if (index < videoElement.audioTracks.length) {
                    for (let i = 0; i < videoElement.audioTracks.length; i++) {
                        if (videoElement.audioTracks[i].enabled === true && i === index) {
                            break;
                        }
                        if (index === i) {
                            console.log("enabeling audio index %d", index);
                            videoElement.audioTracks[i].enabled = true;
                        } else {
                            videoElement.audioTracks[i].enabled = false;
                        }
                    }
                }
            }

            this.stateUpdateHandler({
                audioTracks: videoElement.audioTracks,
                textTracks: videoElement.textTracks
            });
        });
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
                {this.state.isChannelSettingsState && <ChannelSettings ref="info" key={this.state.audioTracks}
                    stateUpdateHandler={this.stateUpdateHandler}
                    channelName={this.getCurrentChannel().getName()}
                    audioTracks={this.state.audioTracks}
                    textTracks={this.state.textTracks} />}

                {this.state.isInfoState && <ChannelInfo ref="info" key={this.state.channelPosition} epgData={this.epgData}
                    imageCache={this.imageCache}
                    stateUpdateHandler={this.stateUpdateHandler}
                    channelPosition={this.state.channelPosition} />}

                {this.state.isChannelListState && <ChannelList ref="list" key={this.state.isChannelListState} epgData={this.epgData}
                    imageCache={this.imageCache}
                    stateUpdateHandler={this.stateUpdateHandler}
                    channelPosition={this.state.channelPosition} />}

                {this.state.isEpgState && <TVGuide ref="epg" key={this.state.isEpgState} epgData={this.epgData}
                    imageCache={this.imageCache}
                    stateUpdateHandler={this.stateUpdateHandler}
                    channelPosition={this.state.channelPosition} />}

                <video id="myVideo" width={this.getWidth()} height={this.getHeight()} autoplay></video>
            </div>
        );
    }
}