import React, { useContext, useEffect, useRef, useState } from 'react';
import ChannelInfo from './ChannelInfo';
import TVGuide from './TVGuide';
import ChannelHeader from './ChannelHeader';
import ChannelList from './ChannelList';
import ChannelSettings from './ChannelSettings';
import EPGUtils from '../utils/EPGUtils';
import AppContext, { AppVisibilityState } from '../AppContext';
import '../styles/app.css';
import StorageHelper from '../utils/StorageHelper';
import EPGEvent from '../models/EPGEvent';
import Spinner from '@enact/moonstone/Spinner';
import { Panel } from '@enact/moonstone/Panels';
import { AppViewState } from '../App';

export enum State {
    TV = 'tv',
    EPG = 'epg',
    CHANNEL_LIST = 'channleList',
    CHANNEL_INFO = 'channelInfo',
    CHANNEL_SETTINGS = 'channelSettings'
}

const TV = () => {
    const {
        menuState,
        appViewState,
        appVisibilityState,
        tvhDataService,
        epgData,
        currentChannelPosition,
        setCurrentChannelPosition
    } = useContext(AppContext);

    const tvWrapper = useRef<HTMLDivElement>(null);
    const video = useRef<HTMLVideoElement>(null);
    const timeoutChangeChannel = useRef<NodeJS.Timeout | null>(null);
    const audioTracksRef = useRef<AudioTrackList>();
    const textTracksRef = useRef<TextTrackList>();

    const [isVideoPlaying, setIsVideoPlaying] = useState(false);
    const [state, setState] = useState<State>(State.CHANNEL_INFO);
    const [channelNumberText, setChannelNumberText] = useState('');

    const focus = () => tvWrapper.current?.focus();

    const handleKeyPress = (event: React.KeyboardEvent<HTMLDivElement>) => {
        // in case we are in menu state we don't handle any keypress
        if (menuState) {
            return;
        }
        const keyCode = event.keyCode;

        switch (keyCode) {
            case 48: // 0
            case 49: // 1
            case 50: // 2
            case 51: // 3
            case 52: // 4
            case 53: // 5
            case 54: // 6
            case 55: // 7
            case 56: // 8
            case 57: // 9
                event.stopPropagation();
                enterChannelNumberPart(keyCode - 48);
                break;
            case 34: // programm down
                event.stopPropagation();
                // channel down
                if (currentChannelPosition === 0) {
                    return;
                }
                changeChannelPosition(currentChannelPosition - 1);
                break;
            case 40: // arrow down
                event.stopPropagation();
                setState(State.CHANNEL_LIST);
                break;
            case 33: // programm up
                event.stopPropagation();
                // channel up
                if (currentChannelPosition === epgData.getChannelCount() - 1) {
                    return;
                }
                changeChannelPosition(currentChannelPosition + 1);
                break;
            case 67: // 'c'
            case 38: // arrow up
                event.stopPropagation();
                setState(State.CHANNEL_LIST);
                break;
            case 406: // blue button show epg
            case 66: // keyboard 'b'
                event.stopPropagation();
                setState(State.EPG);
                break;
            case 13: {
                // ok button ->show/disable channel info
                event.stopPropagation();
                handleChannelInfoSwitch();
                break;
            }
            case 405: // yellow button
            case 89: //'y'
                event.stopPropagation();
                handleChannelSettingsSwitch();
                break;
            case 403: {
                // red button to trigger or cancel recording
                event.stopPropagation();
                const channel = getCurrentChannel();
                const epgEvent = channel?.getEvents().find((event) => event.isCurrent());
                epgEvent && toggleRecording(epgEvent);
                break;
            }
            case 461: // backbutton
                event.stopPropagation();
                setState(State.TV);
                break;
            default:
                console.log('TV-keyPressed:', keyCode);
        }

        // pass unhandled events to parent
        if (!event.isPropagationStopped()) return event;
    };

    const handleChannelInfoSwitch = () => {
        state !== State.CHANNEL_INFO ? setState(State.CHANNEL_INFO) : setState(State.TV);
    };

    const handleChannelSettingsSwitch = () => {
        // if we don't have any audio tracks or text tracks we don't get into channel settings state
        if (!audioTracksRef.current && !textTracksRef.current) {
            return;
        }

        state !== State.CHANNEL_SETTINGS ? setState(State.CHANNEL_SETTINGS) : setState(State.TV);
    };

    const handleScrollWheel = () => {
        setState(State.CHANNEL_LIST);
    };

    const handleClick = () => {
        handleChannelInfoSwitch();
    };

    const getMediaElement = () => video.current;

    const toggleRecording = (epgEvent: EPGEvent, callback?: () => unknown) => {
        // add current viewing channel to records
        // get current event

        if (!epgEvent) return;
        if (epgEvent.isPastDated(EPGUtils.getNow())) {
            // past dated do nothing
            return;
        }

        if (tvhDataService) {
            // check if event is already marked for recording
            const recEvent = epgData.getRecording(epgEvent);
            if (recEvent) {
                // cancel recording
                tvhDataService.cancelRec(recEvent, (recordings) => {
                    epgData.updateRecordings(
                        recordings.filter((rec) => rec.getKind() === 'REC_UPCOMING').map((rec) => rec.getEvents()[0])
                    );
                    callback && callback();
                });
            } else {
                // creat new recording from event
                tvhDataService.createRec(epgEvent, (recordings) => {
                    epgData.updateRecordings(recordings);
                    callback && callback();
                });
            }
        }
    };

    /**
     * Enters a digit that is used as part of the new channel number
     */
    const enterChannelNumberPart = (digit: number) => {
        if (channelNumberText.length < 3) {
            const newChannelNumberText = channelNumberText + digit;
            setChannelNumberText(newChannelNumberText);

            // automatically switch to new channel after 3 seconds
            timeoutChangeChannel.current && clearTimeout(timeoutChangeChannel.current);
            timeoutChangeChannel.current = setTimeout(() => {
                const channelNumber = parseInt(newChannelNumberText);

                epgData.getChannels().forEach((channel, channelPosition) => {
                    if (channel.getChannelID() === channelNumber) {
                        changeChannelPosition(channelPosition);
                    }
                });
            }, 3000);
        } else {
            setChannelNumberText('');
        }
    };

    const changeChannelPosition = (newChannelPosition: number) => {
        if (newChannelPosition === currentChannelPosition) {
            return;
        }
        setCurrentChannelPosition(newChannelPosition);

        // store last used channel
        StorageHelper.setLastChannelIndex(newChannelPosition);
    };

    const handleLoadedMetaData = () => {
        const videoElement = getMediaElement();
        if (!videoElement) return;

        // restore selected audio channel from storage
        const audioTracks = videoElement.audioTracks;
        const textTracks = videoElement.textTracks;
        const currentChannel = getCurrentChannel();
        if (!currentChannel) return;
        const index = StorageHelper.getLastAudioTrackIndex(currentChannel.getName());
        if (index && index < audioTracks.length) {
            console.log('restore index %d for channel %s', index, currentChannel.getName());
            for (let i = 0; i < audioTracks.length; i++) {
                // stored track index is already enabled
                audioTracks[i].enabled = i === index;
            }
        }

        setAudioTracks(audioTracks);
        setTextTracks(textTracks);
    };

    const setAudioTracks = (audioTracks: AudioTrackList | undefined) => {
        audioTracksRef.current = audioTracks;
    };

    const setTextTracks = (textTracks: TextTrackList | undefined) => {
        textTracksRef.current = textTracks;
    };

    const resetPlayer = (videoElement: HTMLVideoElement) => {
        setAudioTracks(undefined);
        setTextTracks(undefined);

        // Remove all source elements
        while (videoElement.firstChild) {
            videoElement.removeChild(videoElement.firstChild);
        }

        // Reset video
        videoElement.load();
    };

    const changeSource = (dataUrl: URL) => {
        const videoElement = getMediaElement();
        if (!videoElement) return;

        resetPlayer(videoElement);
        setIsVideoPlaying(false);

        //const options = {
        //    mediaTransportType: 'URI'
        //};

        // Convert the created object to JSON string and encode it.
        //const mediaOption = encodeURI(JSON.stringify(options));

        // Add new source element
        const source = document.createElement('source');

        // Add attributes to the created source element for media content.
        source.setAttribute('src', dataUrl.toString());
        //source.setAttribute('type', 'video/mp2t;mediaOption=' + mediaOption);
        //source.setAttribute('src', 'https://www.w3schools.com/html/mov_bbb.mp4');
        //source.setAttribute('type', 'video/mp4');
        videoElement.appendChild(source);

        // Auto-play video with some (unused) error handling
        videoElement
            .play()
            .then(() => setIsVideoPlaying(true))
            .catch((error) => console.log('channel switched before it could be played', error));
    };

    const getWidth = () => window.innerWidth;
    const getHeight = () => window.innerHeight;
    const getCurrentChannel = () => epgData.getChannel(currentChannelPosition);

    const showCurrentChannelNumber = () => {
        const channel = epgData.getChannel(currentChannelPosition);
        setChannelNumberText(channel?.getChannelID().toString() || '');
    };

    const updateStreamSource = (streamUrl: URL) => {
        // show the channel info, if the channel was changed
        setState(State.CHANNEL_INFO);

        changeSource(streamUrl);

        // also show the current channel number
        showCurrentChannelNumber();
    };

    useEffect(() => {
        focus();

        return () => {
            const videoElement = getMediaElement();
            if (!videoElement) return;
            resetPlayer(videoElement);
        };
    }, []);

    useEffect(() => {
        // change channel in case we have channels retrieved and channel position changed
        if (epgData.getChannelCount() > 0) {
            const currentChannel = getCurrentChannel();
            if (currentChannel && currentChannel.getChannelID() !== currentChannelPosition) {
                updateStreamSource(currentChannel.getStreamUrl());
            }
        }
    }, [currentChannelPosition]);

    useEffect(() => {
        // if the channel info is shown, also show the current channel number
        if (state === State.CHANNEL_INFO) {
            showCurrentChannelNumber();
        }

        // request focus if none of the other components are active
        if (state === State.TV) {
            focus();
        }
    }, [state]);

    useEffect(() => {
        // if the channel info is shown, also show the current channel number
        if (appViewState === AppViewState.TV) {
            focus();
        }
    }, [appViewState, menuState]);
    /**
     * handle app state changes
     */
    useEffect(() => {
        // state changed to focus -> refocus
        if (appVisibilityState === AppVisibilityState.FOCUSED) {
            console.log('TV: changed to focused');
            setState(State.CHANNEL_INFO);
            showCurrentChannelNumber();
            focus();
        }

        // state changed to background -> stop playback
        if (appVisibilityState === AppVisibilityState.BACKGROUND) {
            console.log('TV: changed to background');
            const videoElement = getMediaElement();
            if (!videoElement) return;
            resetPlayer(videoElement);
        }

        // state changed to foreground -> start playback
        if (appVisibilityState === AppVisibilityState.FOREGROUND) {
            console.log('TV: changed to foreground');
            const currentChannel = getCurrentChannel();
            // manually call update because we want to start the channel as we
            // have in the context -> no context change -> no effect
            // also we only do it if video has no source attached because on
            // first mount the source gets attached by currentChannelPosition effect
            currentChannel && !video.current?.firstChild && updateStreamSource(currentChannel.getStreamUrl());
            focus();
        }
    }, [appVisibilityState]);

    return (
        <div
            id="tv-wrapper"
            ref={tvWrapper}
            tabIndex={-1}
            onKeyDown={handleKeyPress}
            onWheel={handleScrollWheel}
            onClick={handleClick}
            className={isVideoPlaying ? 'tv playing' : 'tv loading'}
        >
            {channelNumberText !== '' && (
                <ChannelHeader channelNumberText={channelNumberText} unmount={() => setChannelNumberText('')} />
            )}

            {!isVideoPlaying && <Spinner centered component={Panel}></Spinner>}

            {state === State.CHANNEL_SETTINGS && (
                <ChannelSettings
                    channelName={getCurrentChannel()?.getName() || ''}
                    audioTracks={audioTracksRef.current}
                    textTracks={textTracksRef.current}
                    unmount={() => setState(State.TV)}
                />
            )}

            {state === State.CHANNEL_INFO && (
                <ChannelInfo
                    unmount={() => {
                        setState(State.TV);
                        setChannelNumberText('');
                    }}
                />
            )}

            {state === State.CHANNEL_LIST && (
                <ChannelList
                    toggleRecording={(event: EPGEvent, callback: () => unknown) => toggleRecording(event, callback)}
                    unmount={() => setState(State.CHANNEL_INFO)}
                />
            )}

            {state === State.EPG && (
                <TVGuide
                    toggleRecording={(event: EPGEvent, callback: () => unknown) => toggleRecording(event, callback)}
                    unmount={() => setState(State.CHANNEL_INFO)}
                />
            )}

            <video
                id="myVideo"
                ref={video}
                width={getWidth()}
                height={getHeight()}
                preload="none"
                onLoadedMetadata={handleLoadedMetaData}
            ></video>
        </div>
    );
};

export default TV;
