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
    const [textTracksDisplay, setTextTracksDisplay] = useState<string[]>([]);
    const [audioTracksDisplay, setAudioTracksDisplay] = useState<string[]>([]);

    const channelSettingsWrapper = useRef<HTMLDivElement>(null);
    const selectedAudioTrack = useRef(0);
    const selectedTextTrack = useRef(0);
    const timeoutReference = useRef<NodeJS.Timeout | null>(null);

    const handleTextChange = (event: { value: number }) => {
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

    const handleAudioChange = (event: { value: number }) => {
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

    const handleKeyPress = (event: React.KeyboardEvent<HTMLDivElement>) => {
        const keyCode = event.keyCode;

        switch (keyCode) {
            case 13: // ok button
                // do not pass this event to parent
                event.stopPropagation();
                break;
            case 461: // back button
            case 405: // yellow button
            case 89: //'y'
                // do not pass this event to parent
                event.stopPropagation();
                props.unmount();
                break;
        }

        // pass unhandled events to parent
        if (!event.isPropagationStopped) return event;
    };

    const setSelectedAudioTrack = (index: number) => {
        selectedAudioTrack.current = index;
    };

    const setSelectedTextTrack = (index: number) => {
        selectedTextTrack.current = index;
    };

    const updateAutomaticUnmount = () => {
        timeoutReference.current && clearTimeout(timeoutReference.current);
        timeoutReference.current = setTimeout(() => props.unmount(), 7000);
    };

    const focus = () => {
        channelSettingsWrapper.current?.focus();
    };

    useEffect(() => {
        focus();

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
        <div
            id="channel-settings"
            ref={channelSettingsWrapper}
            tabIndex={-1}
            className="channelSettings"
            onKeyDown={handleKeyPress}
        >
            {audioTracksDisplay.length > 0 && (
                <>
                    <Icon>audio</Icon>
                    <Picker defaultValue={selectedAudioTrack.current} onChange={handleAudioChange} width="large">
                        {audioTracksDisplay}
                    </Picker>
                </>
            )}

            {textTracksDisplay.length > 0 && (
                <>
                    <Icon>sub</Icon>
                    <Picker defaultValue={selectedTextTrack.current} onChange={handleTextChange} width="large">
                        {textTracksDisplay}
                    </Picker>
                </>
            )}
        </div>
    );
};

export default ChannelSettings;
