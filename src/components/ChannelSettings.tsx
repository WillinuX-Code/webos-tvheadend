import Icon from '@enact/moonstone/Icon';
import Picker from '@enact/moonstone/Picker';
import React, { useEffect, useRef, useState } from 'react';
import StorageHelper from '../utils/StorageHelper';

const ChannelSettings = (props: {
    channelName: string;
    textTracks: TextTrackList | undefined;
    audioTracks: AudioTrackList | undefined;
    unmount: () => void;
}) => {
    const [selectedAudioTrack, setSelectedAudioTrack] = useState(0);
    const [selectedTextTrack, setSelectedTextTrack] = useState(0);
    const [textTracksDisplay, setTextTracksDisplay] = useState<string[]>([]);
    const [audioTracksDisplay, setAudioTracksDisplay] = useState<string[]>([]);
    const timeoutReference = useRef<NodeJS.Timeout | null>(null);

    const handleTextChange = (event: any) => {
        updateAutomaticUnmount();

        // enable new track
        if (props.textTracks) {
            for (let i = 0; i < props.textTracks.length; i++) {
                // const textTrack = props.textTracks[i];
                // textTrack.enabled = (event.value === i);
            }
        }
        setSelectedTextTrack(event.value);

        // TODO: save selected text track index for channel
        // localStorage.setItem(props.channelName, event.value);

        // do not pass this event further
        return false;
    };

    const handleAudioChange = (event: any) => {
        updateAutomaticUnmount();

        // enable new track
        if (props.audioTracks) {
            for (let i = 0; i < props.audioTracks.length; i++) {
                const audioTrack = props.audioTracks[i];
                audioTrack.enabled = event.value === i;
            }
        }
        setSelectedAudioTrack(event.value);

        // save selected audio track index for channel
        StorageHelper.setLastAudioTrackIndex(props.channelName, event.value);

        // do not pass this event further
        return false;
    };

    const updateAutomaticUnmount = () => {
        timeoutReference.current && clearTimeout(timeoutReference.current);
        timeoutReference.current = setTimeout(() => props.unmount(), 7000);
    };

    useEffect(() => {
        if (props.audioTracks) {
            for (let i = 0; i < props.audioTracks.length; i++) {
                const audioTrack = props.audioTracks[i];
                setAudioTracksDisplay((audioTracksDisplay) => [...audioTracksDisplay, audioTrack.language]);
                audioTrack.enabled && setSelectedAudioTrack(i);
            }
        }

        if (props.textTracks) {
            for (let i = 0; i < props.textTracks.length; i++) {
                const textTrack = props.textTracks[i];
                setTextTracksDisplay((textTracksDisplay) => [...textTracksDisplay, textTrack.language]);
                // textTrack.enabled && setSelectedTextTrack(i);
            }
        }

        // automatic unmount
        updateAutomaticUnmount();

        return () => {
            // clear timeout in case component is unmounted
            timeoutReference.current && clearTimeout(timeoutReference.current);
        };
    }, []);

    return (
        <div id="channel-settings" tabIndex={-1} className="channelSettings">
            {audioTracksDisplay.length > 0 && (
                <>
                    <Icon>audio</Icon>
                    <Picker defaultValue={selectedAudioTrack} onChange={handleAudioChange} width="large">
                        {audioTracksDisplay}
                    </Picker>
                </>
            )}

            {textTracksDisplay.length > 0 && (
                <>
                    <Icon>sub</Icon>
                    <Picker defaultValue={selectedTextTrack} onChange={handleTextChange} width="large">
                        {textTracksDisplay}
                    </Picker>
                </>
            )}
        </div>
    );
};

export default ChannelSettings;
