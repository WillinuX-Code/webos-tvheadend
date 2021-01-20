import React, { Component } from 'react';

import 'babel-polyfill';
import TVHDataService from './services/TVHDataService';
import EPGData from './models/EPGData';
import TV from './components/TV';
import TVHSettings from './components/TVHSettings';
import './styles/app.css';

export default class App extends Component {

  private epgData: EPGData = new EPGData();
  private imageCache: Map<URL, HTMLImageElement> = new Map();
  private tvhDataService?: TVHDataService;

  state: {
    isSettingsState: boolean;
    lastEpgUpdate: number;
  }

  constructor(public props: Readonly<any>) {
    super(props);

    this.state = {
      isSettingsState: true,
      lastEpgUpdate: 0
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
    let channels = await tvhDataService.retrieveM3UChannels();
    this.epgData.updateChannels(channels);

    // preload images
    this.preloadImages();

    // force update to load/preload video already
    this.forceUpdate();

    // reetrievee epg and update channels
    tvhDataService.retrieveTVHEPG(0, channels => {
      this.epgData.updateChannels(channels);
    });

    tvhDataService.retrieveUpcomingRecordings(recordings => {
      this.epgData.updateRecordings(recordings);
    });
  }

  handleUnmountSettings() {
    let settingsString = localStorage.getItem(TVHSettings.STORAGE_TVH_SETTING_KEY);
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
      let localInfoResult = await tvhDataService.getLocaleInfo();
      let locale = localInfoResult.settings.localeInfo.locales.UI;

      // udpate epg
      this.epgData.updateLanguage(locale);
      console.log("Retrieved locale info:", locale);
    } catch (error) {
      console.log("Failed to retrieve locale info: ", error);
    };
  }

  /**
   * preload all images and set placeholders
   * if images cannot be loaded
   */
  preloadImages() {
    this.epgData.getChannels().forEach(channel => {
      let imageURL = channel.getImageURL();
      let img = new Image();
      img.src = imageURL.toString();
      img.onload = () => {
        this.imageCache.set(imageURL, img);
      }
    })
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
    let keyCode = event.keyCode;

    switch (keyCode) {
      case 404: // green button
      case 71: //'g'
        event.stopPropagation();
        this.setState((state, props) => ({
          isSettingsState: true
        }))
        break;
      default:
        console.log('App-keyPressed:', keyCode);
    }
  };

  // Test if commenting this will make it faster to load
  // shouldComponentUpdate(nextProps, nextState) {
  //   return nextProps.lastEPGUpdate !== this.state.lastEPGUpdate || this.state.isSettingsState !== nextState.isSettingsState;
  // }

  componentDidMount() {
    // update state in case setttings exist
    let settingsString = localStorage.getItem(TVHSettings.STORAGE_TVH_SETTING_KEY);
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
      <div className="app" onKeyDown={this.handleKeyPress}>
        {this.state.isSettingsState &&
          <TVHSettings handleUnmountSettings={this.handleUnmountSettings} tvhService={this.tvhDataService} />}

        {!this.state.isSettingsState &&
          <TV tvhService={this.tvhDataService} epgData={this.epgData} imageCache={this.imageCache} />}
      </div>
    );
  }
}
