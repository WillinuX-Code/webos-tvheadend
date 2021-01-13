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

    private textTracks;
    private audioTracks;
    private textTracksDisplay;
    private audioTracksDisplay;
    private timeoutId: NodeJS.Timeout | null;

    state: Readonly<any>;

    constructor(public props: Readonly<any>) {
        super(props);

        this.textTracks = props.textTracks;
        this.audioTracks = props.audioTracks;
        this.textTracksDisplay = [];
        this.audioTracksDisplay = [];
        this.timeoutId = null;

        let selectedAudioTrack = -1;
        for (var i = 0; i < this.audioTracks.length; i++) {
            if (this.audioTracks[i].enabled === true) {
                selectedAudioTrack = i;
            }
            this.audioTracksDisplay.push(this.audioTracks[i].language);
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

    textChangeHandler = (object: any) => {
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
    };

    audioChangeHandler = (object: any) => {
        this.updateAutomaticUnmount();
        // disable previous track
        this.audioTracks[this.state.selectedAudioTrack].enabled = false;
         // enable new track
        this.audioTracks[object.value].enabled = true;
        // enable current selected audio
        this.setState((state, props) => ({
            selectedAudioTrack: object.value
        }));
        // save selected audio track index for channel
        localStorage.setItem(this.state.channelName, object.value);
        // do not pass this event further
        return false;
    };

    componentDidMount() {
        // automatic unmount
        this.updateAutomaticUnmount();
    }

    unmountHandler = () => {
        // clear timeout before unmount
        this.timeoutId && clearTimeout(this.timeoutId);

        this.props.stateUpdateHandler({
            isChannelSettingsState: false
        });
    };

    updateAutomaticUnmount() {
        this.timeoutId && clearTimeout(this.timeoutId);
        this.timeoutId = setTimeout(this.unmountHandler, 7000);
    }

    componentDidUpdate(prevProps: any) {
        
    }

    componentWillUnmount() {
        // clear timeout in case component is unmounted (possible trigger also from TV Component)
        this.timeoutId && clearTimeout(this.timeoutId);
    }

    render() {
        return (
            <div id="channel-settings" tabIndex={-1} className="channelSettings">
                {this.audioTracksDisplay.length > 0 &&
                    <>
                        <Icon>audio</Icon>
                        <Picker defaultValue={this.state.selectedAudioTrack} onChange={this.audioChangeHandler} width="large">
                            {this.audioTracksDisplay}
                        </Picker>
                    </>
                }

                {this.textTracksDisplay.length > 0 &&
                    <>
                        <Icon>sub</Icon>
                        <Picker defaultValue={this.state.selectedTextTrack} onChange={this.textChangeHandler} width="large">
                            {this.textTracksDisplay}
                        </Picker>
                    </>
                }
            </div>
        );
    }
}