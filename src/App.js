import React, { Component } from 'react';

import "babel-polyfill";
import TVHDataService from './services/TVHDataService';
import EPGData from './models/EPGData';
import EPGUtils from './utils/EPGUtils';
import TV from './components/TV';
import './App.css';
export default class App extends Component {

  constructor(props) {
    super(props);

    this.state = {  
      lastEPGUpdate: 0
    };
    
    this.epgData = new EPGData();
    this.epgUtils = new EPGUtils();
    this.imageCache = new Map();
    this.tvhDataService = new TVHDataService();
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
  

  // Test if commenting this will make it faster to load
  shouldComponentUpdate(nextProps) {
    return nextProps.lastEPGUpdate !== this.state.lastEPGUpdate;
  }

  componentDidMount() {
    this.tvhDataService.getLocaleInfo(res => {
      console.log(res);
      this.epgData.updateLanguage(res.settings.localeInfo.locales.UI);
    });
    this.tvhDataService.retrieveTVHChannels(0, channels => {
      this.epgData.updateChannels(channels);
      this.setState((state, props) => ({
        lastEPGUpdate: Date.now()
      }));
      // preload image cache
      this.preloadImages();
      // reetrievee epg and update channels
      this.tvhDataService.retrieveTVHEPG(0, channels => {
        this.epgData.updateChannels(channels);
        this.setState((state, props) => ({
          lastEPGUpdate: Date.now()
        }));
      });
      //this.recalculateAndRedraw(false);
    });
    this.tvhDataService.retrieveUpcomingRecordings(recordings => {
      this.epgData.updateRecordings(recordings);
      this.setState((state, props) => ({
        lastEPGUpdate: Date.now()
      }));
    });
  }

  componentDidUpdate() {
    
  }

  render() {
    return (
      <div className="App">
        <TV ref="tv" epgData={this.epgData} imageCache={this.imageCache} />
      </div>
    );
  }
}
