import React, { Component } from 'react';

import "babel-polyfill";
import TVHDataService from './services/TVHDataService';
import EPGData from './models/EPGData';
import EPGUtils from './utils/EPGUtils';
import TV from './components/TV';
import './App.css';
import TVHSettings from './components/TVHSettings';

export default class App extends Component {

  constructor(props) {
    super(props);

    this.state = {
      isSettingsState: true
    };

    this.handleKeyPress = this.handleKeyPress.bind(this);
    this.handleUnmountSettings = this.handleUnmountSettings.bind(this);
    this.epgData = new EPGData();
    this.epgUtils = new EPGUtils();
    this.imageCache = new Map();
  }

  reloadData() {
    this.tvhDataService.getLocaleInfo(res => {
      console.log(res);
      this.epgData.updateLanguage(res.settings.localeInfo.locales.UI);
    });
    this.tvhDataService.retrieveTVHChannels(0, channels => {
      this.epgData.updateChannels(channels);
      // preload image cache
      this.preloadImages();
      // reetrievee epg and update channels
      this.tvhDataService.retrieveTVHEPG(0, channels => {
        this.epgData.updateChannels(channels);
      });
      //this.recalculateAndRedraw(false);
    });
    this.tvhDataService.retrieveUpcomingRecordings(recordings => {
      this.epgData.updateRecordings(recordings);
    });
  }

  handleUnmountSettings() {
    this.settings = JSON.parse(localStorage.getItem(TVHSettings.STORAGE_TVH_SETTING_KEY));
    if (this.settings.isValid) {
      this.tvhDataService = new TVHDataService(this.settings);
      this.setState((state, props) => ({
        isSettingsState: false
      }));
      this.reloadData();
    } else {
      this.setState((state, props) => ({
        isSettingsState: true
      }));
      return;
    }
  }
  /**
   * preload all images and set placeholders
   * if images cannot be loaded
   */
  async preloadImages() {
    this.epgData.channels.forEach(channel => {
      let imageURL = channel.getImageURL();
      let img = new Image();
      img.src = imageURL;
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

  handleKeyPress(event) {
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
        console.log("App-keyPressed:", keyCode);
    }
  };

  // Test if commenting this will make it faster to load
  // shouldComponentUpdate(nextProps, nextState) {
  //   return nextProps.lastEPGUpdate !== this.state.lastEPGUpdate || this.state.isSettingsState !== nextState.isSettingsState;
  // }

  componentDidMount() {
    // update state in case setttings exist
    this.settings = localStorage.getItem(TVHSettings.STORAGE_TVH_SETTING_KEY);
    if (this.settings) {
      this.tvhDataService = new TVHDataService(JSON.parse(this.settings));
      this.setState((state, props) => ({
        isSettingsState: false
      }));
      this.reloadData();
    } else {
      this.setState((state, props) => ({
        isSettingsState: true
      }));
    }
  }

  componentDidUpdate() {
  }

  render() {
    return (
      <div className="App" onKeyDown={this.handleKeyPress}>
        {this.state.isSettingsState &&
          <TVHSettings handleUnmountSettings={this.handleUnmountSettings} />}

        {!this.state.isSettingsState &&
          <TV ref="tv" epgData={this.epgData} imageCache={this.imageCache} />}
      </div>
    );
  }
}
