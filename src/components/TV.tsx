import React, { useContext, useEffect, useRef, useState } from 'react';
import ChannelInfo from './ChannelInfo';
import TVGuide from './TVGuide';
import ChannelHeader from './ChannelHeader';
import ChannelList from './ChannelList';
import ChannelSettings from './ChannelSettings';
import EPGUtils from '../utils/EPGUtils';
import AppContext from '../AppContext';
import '../styles/app.css';

const STORAGE_KEY_LAST_CHANNEL = 'lastChannel';

export enum State {
    TV = 'tv',
    EPG = 'epg',
    CHANNEL_LIST = 'channleList',
    CHANNEL_INFO = 'channelInfo'
}

const TV = () => {
    const { tvhDataService, epgData, currentChannelPosition, setCurrentChannelPosition } = useContext(AppContext);

    const tvWrapper = useRef<HTMLDivElement>(null);
    const video = useRef<HTMLVideoElement>(null);
    const timeoutChangeChannel = useRef<NodeJS.Timeout | null>(null);

    const [audioTracks, setAudioTracks] = useState<AudioTrackList>();
    const [textTracks, setTextTracks] = useState<TextTrackList>();
    const [channelNumberText, setChannelNumberText] = useState('');
    const [isState, setState] = useState<State>(State.CHANNEL_INFO);
    const [isChannelSettingsState, setChannelSettingsState] = useState(false);
    const epgUtils = new EPGUtils();

    const focus = () => tvWrapper.current?.focus();

    const handleKeyPress = (event: React.KeyboardEvent<HTMLDivElement>) => {
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
                // in channel settings state we dont process the ok - the channel settings component handles it
                if (isChannelSettingsState) {
                    break;
                }
                handleChannelInfoSwitch();
                break;
            }
            case 405: // yellow button
            case 89: //'y'
                event.stopPropagation();
                setChannelSettingsState(!isChannelSettingsState);
                break;
            case 403: // red button to trigger or cancel recording
                event.stopPropagation();
                toggleRecording();
                break;
            default:
                console.log('TV-keyPressed:', keyCode);
        }
    };

    const handleChannelInfoSwitch = () => {
        switch (isState) {
            case State.TV:
                setState(State.CHANNEL_INFO);
                break;
            case State.CHANNEL_INFO:
                setState(State.TV);
                break;
        }
    };

    const handleScrollWheel = () => {
        setState(State.CHANNEL_LIST);
    };

    const handleClick = () => {
        handleChannelInfoSwitch();
    };

    const getMediaElement = () => video.current;

    const toggleRecording = () => {
        // add current viewing channel to records
        // get current event
        const channel = getCurrentChannel();
        const epgEvent = channel?.getEvents().find((channel) => channel.isCurrent());

        if (!epgEvent) return;
        if (epgEvent.isPastDated(epgUtils.getNow())) {
            // past dated do nothing
            return;
        }

        if (tvhDataService) {
            // check if event is already marked for recording
            const recEvent = epgData.getRecording(epgEvent);
            if (recEvent) {
                // cancel recording
                tvhDataService.cancelRec(recEvent, (recordings) => {
                    epgData.updateRecordings(recordings);
                    //this.updateCanvas();
                });
            } else {
                // creat new recording from event
                tvhDataService.createRec(epgEvent, (recordings) => {
                    epgData.updateRecordings(recordings);
                    //this.updateCanvas();
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
        }
    };

    const changeChannelPosition = (newChannelPosition: number) => {
        if (newChannelPosition === currentChannelPosition) {
            return;
        }
        setCurrentChannelPosition(newChannelPosition);

        // store last used channel
        localStorage.setItem(STORAGE_KEY_LAST_CHANNEL, newChannelPosition.toString());
    };

    const initVideoElement = () => {
        const videoElement = getMediaElement();

        videoElement?.addEventListener('loadedmetadata', () => {
            if (!videoElement) return;
            console.log('Audio Tracks: ', videoElement.audioTracks);
            console.log('Text Tracks: ', videoElement.textTracks);

            // restore selected audio channel from storage
            const currentChannel = getCurrentChannel();
            if (!currentChannel) return;
            const indexStr = localStorage.getItem(currentChannel.getName());
            if (indexStr) {
                const index = parseInt(indexStr);
                console.log('restore index %d for channel %s', index, getCurrentChannel()?.getName());

                if (index < videoElement.audioTracks.length) {
                    for (let i = 0; i < videoElement.audioTracks.length; i++) {
                        if (videoElement.audioTracks[i].enabled === true && i === index) {
                            break;
                        }
                        if (index === i) {
                            console.log('enabeling audio index %d', index);
                            videoElement.audioTracks[i].enabled = true;
                        } else {
                            videoElement.audioTracks[i].enabled = false;
                        }
                    }
                }
            }

            setAudioTracks(videoElement.audioTracks);
            setTextTracks(videoElement.textTracks);
        });
    };

    const changeSource = (dataUrl: URL) => {
        const videoElement = getMediaElement();
        if (!videoElement) return;

        // Remove all source elements
        while (videoElement.firstChild) {
            videoElement.removeChild(videoElement.firstChild);
        }

        // Reset video
        videoElement.load();

        const options = {
            mediaTransportType: 'URI'
        };

        // Convert the created object to JSON string and encode it.
        const mediaOption = encodeURI(JSON.stringify(options));

        // Add new source element
        const source = document.createElement('source');

        // Add attributes to the created source element for media content.
        source.setAttribute('src', dataUrl.toString());
        source.setAttribute('type', 'video/mp2t;mediaOption=' + mediaOption);
        //source.setAttribute('src', 'https://www.w3schools.com/html/mov_bbb.mp4');
        //source.setAttribute('type', 'video/mp4');
        videoElement.appendChild(source);

        // Auto-play video with some (unused) error handling
        videoElement
            .play()
            .then()
            .catch(() => console.log('channel switched before it could be played'));
    };

    const getWidth = () => window.innerWidth;
    const getHeight = () => window.innerHeight;
    const getCurrentChannel = () => epgData.getChannel(currentChannelPosition);

    const showCurrentChannelNumber = () => {
        const channel = epgData.getChannel(currentChannelPosition);
        setChannelNumberText(channel?.getChannelID().toString() || '');
    };

    useEffect(() => {
        // read last channel position from storage
        const lastChannelPosition = parseInt(localStorage.getItem(STORAGE_KEY_LAST_CHANNEL) || '0');
        changeChannelPosition(lastChannelPosition);

        // init video element
        initVideoElement();
        focus();

        return () => {
            // Anything in here is fired on component unmount.
            const videoElement = getMediaElement();

            // Remove all source elements
            while (videoElement?.firstChild) {
                videoElement.removeChild(videoElement.firstChild);
            }
        };
    }, []);

    useEffect(() => {
        // change channel in case we have channels retrieved and channel position changed
        if (epgData.getChannelCount() > 0) {
            const currentChannel = getCurrentChannel();
            if (currentChannel && currentChannel.getChannelID() !== currentChannelPosition) {
                changeSource(currentChannel.getStreamUrl());

                // show the channel info, if the channel was changed
                setState(State.CHANNEL_INFO);

                // also show the current channel number
                showCurrentChannelNumber();
            }
        }
    }, [currentChannelPosition]);

    useEffect(() => {
        // if the channel info is shown, also show the current channel number
        if (isState === State.CHANNEL_INFO) {
            showCurrentChannelNumber();
        }

        // request focus if none of the other components are active
        if (isState === State.TV && !isChannelSettingsState) {
            focus();
        }
    }, [isState, isChannelSettingsState]);

    return (
        <div
            id="tv-wrapper"
            ref={tvWrapper}
            tabIndex={-1}
            onKeyDown={handleKeyPress}
            onWheel={handleScrollWheel}
            onClick={handleClick}
            className="tv"
        >
            {channelNumberText !== '' && (
                <ChannelHeader channelNumberText={channelNumberText} unmount={() => setChannelNumberText('')} />
            )}

            {isChannelSettingsState && (
                <ChannelSettings
                    channelName={getCurrentChannel()?.getName() || ''}
                    audioTracks={audioTracks}
                    textTracks={textTracks}
                    unmount={() => setChannelSettingsState(false)}
                />
            )}

            {isState === State.CHANNEL_INFO && (
                <ChannelInfo
                    unmount={() => {
                        setState(State.TV);
                        setChannelNumberText('');
                    }}
                />
            )}

            {isState === State.CHANNEL_LIST && <ChannelList unmount={() => setState(State.CHANNEL_INFO)} />}

            {isState === State.EPG && <TVGuide unmount={() => setState(State.CHANNEL_INFO)} />}

            <video id="myVideo" ref={video} width={getWidth()} height={getHeight()} preload="none"></video>
        </div>
    );
};

export default TV;
