import React, { Component } from 'react';

import TVHDataService from './services/TVHDataService';
import EPGData from './models/EPGData';
import TV from './components/TV';
import TVHSettings from './components/TVHSettings';
import './styles/app.css';
import { AppContext } from './AppContext';

export default class App extends Component {
    private epgData: EPGData = new EPGData();
    private imageCache: Map<URL, HTMLImageElement> = new Map();
    private tvhDataService?: TVHDataService;
    private intervalHandle?: NodeJS.Timeout;

    state: {
        isSettingsState: boolean;
        lastEpgUpdate: number;
        context: {
            locale: string;
        };
    };

    constructor(public props: Readonly<any>) {
        super(props);

        this.state = {
            isSettingsState: false,
            lastEpgUpdate: 0,
            context: {
                locale: 'en-US'
            }
        };

        this.handleKeyPress = this.handleKeyPress.bind(this);
        this.handleUnmountSettings = this.handleUnmountSettings.bind(this);
        this.epgData = new EPGData();
        this.imageCache = new Map();
    }

    async reloadData(tvhDataService: TVHDataService) {
        // load locale
        this.loadLocale(tvhDataService);

        // retrieve channel infos etc
        const channels = await tvhDataService.retrieveM3UChannels();
        this.epgData.updateChannels(channels);

        /**
         * tvheadend 4.2 with user authentication put a ticket in the stream
         * url which authenticates the stream. This ticket invalidates every 5 minutes
         * so we need to update the stream url of every channel every 4 minutes
         */
        if (channels.length > 0 && channels[0].getStreamUrl().toString().includes('ticket=')) {
            this.intervalHandle && clearInterval(this.intervalHandle);
            this.intervalHandle = setInterval(async () => {
                const channels = await tvhDataService.retrieveM3UChannels();
                this.epgData.updateStreamUrl(channels);
            }, 4 * 60 * 1000);
            this.intervalHandle.unref();
        }
        // preload images
        this.preloadImages();

        // force update to load/preload video already
        this.forceUpdate();

        // reetrievee epg and update channels
        tvhDataService.retrieveTVHEPG(0, (channels) => {
            this.epgData.updateChannels(channels);
        });

        tvhDataService.retrieveUpcomingRecordings((recordings) => {
            this.epgData.updateRecordings(recordings);
        });
    }

    handleUnmountSettings() {
        // read settings
        const settingsString = localStorage.getItem(TVHSettings.STORAGE_TVH_SETTING_KEY);
        if (settingsString) {
            this.tvhDataService = new TVHDataService(JSON.parse(settingsString));
            this.setState((state, props) => ({
                isSettingsState: false
            }));
            this.reloadData(this.tvhDataService);
        } else {
            this.setState((state, props) => ({
                isSettingsState: true
            }));
        }
    }

    async loadLocale(tvhDataService: TVHDataService) {
        try {
            // retrieve local info
            const localInfoResult = await tvhDataService.getLocaleInfo();
            const locale = localInfoResult.settings.localeInfo.locales.UI;

            this.setState((state, props) => ({
                context: {
                    locale: locale
                }
            }));
            console.log('Retrieved locale info:', locale);
        } catch (error) {
            console.log('Failed to retrieve locale info: ', error);
        }
    }

    /**
     * preload all images and set placeholders
     * if images cannot be loaded
     */
    preloadImages() {
        this.epgData.getChannels().forEach((channel) => {
            const imageURL = channel.getImageURL();
            // logo url is optional
            if (!imageURL) {
                return;
            }
            const img = new Image();
            img.src = imageURL.toString();
            img.onload = () => {
                this.imageCache.set(imageURL, img);
            };
        });
    }

    /* SAMPLE CODE FOR background and visibility events
  // Set the name of the "hidden" property and the change event for visibility
var hidden, visibilityChange;
if (typeof document.hidden !== "undefined") {   // To support the standard web browser engine
    hidden = "hidden";
    visibilityChange = "visibilitychange";
} else if (typeof document.webkitHidden !== "undefined") {   // To support the webkit engine
    hidden = "webkitHidden";
    visibilityChange = "webkitvisibilitychange";
}
....
 
function initAudioElement() {
  // Handle page visibility change 
  document.addEventListener(visibilityChange, handleVisibilityChange, false);
}
 
...
// On app suspend, pause the audio element and stop all web audio api sounds
function suspend() {
  var audioElement = document.getElementById("audioElement");
  audioElement.pause();
  source.stopAll();
}
 
function resume() {
  var audioElement = document.getElementById("audioElement");
  audioElement.play();
}
 
// If the page is hidden, pause the audio
// if the page is shown, play the audio
function handleVisibilityChange() {
  if (document[hidden]) {
    console.log("app suspend");
    suspend();
  } else {
    console.log("app resume");
    resume();
  }
}
*/

    handleKeyPress(event: React.KeyboardEvent<HTMLDivElement>) {
        const keyCode = event.keyCode;

        switch (keyCode) {
            case 404: // green button
            case 71: //'g'
                event.stopPropagation();
                this.setState((state, props) => ({
                    isSettingsState: true
                }));
                break;
            default:
                console.log('App-keyPressed:', keyCode);
        }
    }

    // Test if commenting this will make it faster to load
    // shouldComponentUpdate(nextProps, nextState) {
    //   return nextProps.lastEPGUpdate !== this.state.lastEPGUpdate || this.state.isSettingsState !== nextState.isSettingsState;
    // }

    componentDidMount() {
        // update state in case setttings exist
        const settingsString = localStorage.getItem(TVHSettings.STORAGE_TVH_SETTING_KEY);
        if (settingsString) {
            this.tvhDataService = new TVHDataService(JSON.parse(settingsString));
            this.setState((state, props) => ({
                isSettingsState: false
            }));
            this.reloadData(this.tvhDataService);
        } else {
            this.setState((state, props) => ({
                isSettingsState: true
            }));
        }
    }

    render() {
        return (
            <AppContext.Provider value={this.state.context}>
                <div className="app" onKeyDown={this.handleKeyPress}>
                    {this.state.isSettingsState && (
                        <TVHSettings
                            handleUnmountSettings={this.handleUnmountSettings}
                            tvhService={this.tvhDataService}
                        />
                    )}

                    {!this.state.isSettingsState && (
                        <TV tvhService={this.tvhDataService} epgData={this.epgData} imageCache={this.imageCache} />
                    )}
                </div>
            </AppContext.Provider>
        );
    }
}
