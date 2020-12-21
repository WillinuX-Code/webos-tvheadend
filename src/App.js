import React, { Component } from 'react';

import "babel-polyfill";
import TVHDataService from './EPG/services/TVHDataService';
import TVGuide from './EPG/components/TVGuide';
import ChannelList from './TV/ChannelList';
import EPGData from './EPG/models/EPGData';
import EPGUtils from './EPG/utils/EPGUtils';
import TV from './TV/TV';
import './App.css';
export default class App extends Component {

  constructor(props) {
    super(props);

    this.state = {
      isEpgState: false,
      isChannelListState: false,
      channelPosition: 0,
      lastEPGUpdate: 0
    };
    this.showEpgHandler = this.showEpgHandler.bind(this);
    this.showTvHandler = this.showTvHandler.bind(this);
    this.showChannelListHandler = this.showChannelListHandler.bind(this);

    this.epgData = new EPGData();
    this.epgUtils = new EPGUtils();
    this.imageCache = new Map();
    this.tvhDataService = new TVHDataService();
  }

  showEpgHandler(channelPosition) {
    this.setState((state, props) => ({
      isEpgState: true,
      channelPosition: channelPosition
    }));
  }

  showChannelListHandler(channelPosition) {
    this.setState((state, props) => ({
      isChannelListState: true,
      channelPosition: channelPosition
    }));
  }

  /**
   * Trigger from EPG to hide epg/show tv
   * and switch channel
   * 
   * @param  channelPosition 
   */
  showTvHandler(channelPosition) {
    this.setState((state, props) => ({
      isEpgState: false,
      isChannelListState: false,
      channelPosition: channelPosition
    }));
    this.refs.tv.focus();
    if (channelPosition !== undefined) {
      this.refs.tv.changeChannelPosition(channelPosition);
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
  

  // Test if commenting this will make it faster to load
  shouldComponentUpdate(nextProps) {
    return nextProps.lastEPGUpdate !== this.state.lastEPGUpdate;
  }

  componentDidMount() {
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
        <TV ref="tv" epgData={this.epgData}
          imageCache={this.imageCache}
          showEpgHandler={this.showEpgHandler} showChannelListHandler={this.showChannelListHandler}/>
        {this.state.isChannelListState && <ChannelList ref="list" epgData={this.epgData}
          imageCache={this.imageCache}
          showTvHandler={this.showTvHandler}
          channelPosition={this.state.channelPosition}/>}
        {this.state.isEpgState && <TVGuide ref="epg" epgData={this.epgData}
          imageCache={this.imageCache}
          showTvHandler={this.showTvHandler} 
          channelPosition={this.state.channelPosition}/> }
      </div>
    );
  }
}
