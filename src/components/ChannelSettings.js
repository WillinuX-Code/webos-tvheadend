/**
 * Allow settings of
 * - audio tracks
 * - text/subtitle tracks
 * - aspect ratio
 */
import React, { Component } from 'react';
import Icon from '@enact/moonstone/Icon';
import Picker from '@enact/moonstone/Picker';
import '../styles/app.css';
export default class ChannelSettings extends Component {

    constructor(props) {
        super(props);

        this.textTracks = props.textTracks;
        this.audioTracks = props.audioTracks;
        // contains a mapping between display and audiotrack index
        this.audioIndexMap = new Map();
        this.textTracksDisplay = [];
        this.audioTracksDisplay = [];
        this.timeoutId = {};

        let selectedAudioTrack = -1;
        for (var i = 0; i < this.audioTracks.length; i++) {
            let audioTrack = this.audioTracks[i];
            // filter mis and mul
            if(audioTrack.language === "mul" || audioTrack.language === "mis") {
                continue;
            }
            this.audioTracksDisplay.push(audioTrack.language);
            let displayIndex = this.audioTracksDisplay.length - 1;
            // map display index to audiotrack index
            this.audioIndexMap.set(displayIndex, i);
            if (audioTrack.enabled === true) {
                selectedAudioTrack = displayIndex;
            }
        }
        let selectedTextTrack = -1;
        for (i = 0; i < this.textTracks.length; i++) {
            if (this.textTracks[i].enabled === true) {
                selectedTextTrack = i;
            }
            this.textTracksDisplay.push(this.textTracks[i].language);
        }

        this.state = {
            channelName: props.channelName,
            selectedAudioTrack: selectedAudioTrack,
            selectedTextTrack: selectedTextTrack
        }
       
    }

    handleTextChange(object) {
        this.updateAutomaticUnmount();

        // disable previous track
        this.textTracks[this.state.selectedTextTrack].enabled = false;
        // enable new track
        this.textTracks[object.value].enabled = true;
        // enable current selected audio
        this.setState((state, props) => ({
            selectedTextTrack: object.value
        }));
        // do not pass this event further
        return false;
    }

    handleAudioChange(object) {
        this.updateAutomaticUnmount();
        // disable previous track
        this.audioTracks[this.state.selectedAudioTrack].enabled = false;
        let audioIndex = this.audioIndexMap.get(object.value);
        // enable new track
        this.audioTracks[audioIndex].enabled = true;
        // enable current selected audio
        this.setState((state, props) => ({
            selectedAudioTrack: audioIndex
        }));
        // save selected audio track index for channel
        localStorage.setItem(this.state.channelName, object.value);
        // do not pass this event further
        return false;
    }

    componentDidMount() {
        // automatic unmount
        this.updateAutomaticUnmount();
    }

    unmountHandler() {
        // clear timeout before unmount
        clearTimeout(this.timeoutId);

        this.props.stateUpdateHandler({
            isChannelSettingsState: false
        });
    }

    updateAutomaticUnmount() {
        clearTimeout(this.timeoutId);
        this.timeoutId = setTimeout(this.unmountHandler.bind(this), 7000);
    }

    componentDidUpdate(prevProps) {
        
    }

    componentWillUnmount() {
        // clear timeout in case component is unmounted (possible trigger also from TV Component)
        clearTimeout(this.timeoutId);
    }

    render() {
        return (
            <div id="channel-settings" tabIndex='-1' className="channelSettings">
                {this.audioTracksDisplay.length > 0 &&
                    <>
                        <Icon>audio</Icon>
                        <Picker defaultValue={this.state.selectedAudioTrack} onChange={this.handleAudioChange.bind(this)} size="large">
                            {this.audioTracksDisplay}
                        </Picker>
                    </>
                }

                {this.textTracksDisplay.length > 0 &&
                    <>
                        <Icon>sub</Icon>
                        <Picker defaultValue={this.state.selectedTextTrack} onChange={this.handleTextChange.bind(this)} size="large">
                            {this.textTracksDisplay}
                        </Picker>
                    </>
                }
            </div>
        );
    }
}