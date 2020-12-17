import React, { Component } from 'react';

import "babel-polyfill";
import TVHDataService from './EPG/services/TVHDataService';
import TVGuide from './EPG/components/TVGuide';
import EPGData from './EPG/models/EPGData';
import EPGUtils from './EPG/utils/EPGUtils';
import TV from './TV/TV';
import './App.css';
export default class App extends Component {

  constructor(props) {
    super(props);

    this.state = {
      isTVState: true,
      isEpgState: false,
      lastEPGUpdate: 0
    };
    this.showEpgHandler = this.showEpgHandler.bind(this)
    this.showTvHandler = this.showTvHandler.bind(this)
    this.handleKeyPress = this.handleKeyPress.bind(this);
    this.epgData = new EPGData();
    this.epgUtils = new EPGUtils();
    this.imageCache = new Map();
    this.tvhDataService = new TVHDataService();
  }

  showEpgHandler(channelPosition) {
    this.setState((state, props) => ({
      isEpgState: true,
      isTVState: false
    }));
    if(channelPosition !== undefined) {
      this.refs.epg.setChannelPosition(channelPosition);
    }
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
      isTVState: true
    }));
    this.refs.tv.setFocus();
    if(channelPosition !== undefined) {
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
      // TODO on error set placeholder image
    })
  }

  handleKeyPress(event) {
    let keyCode = event.keyCode;

    switch (keyCode) {
      case 40:
        // channelPosition += 1;
        // if (channelPosition < this.epgData.getChannelCount()) {

        //   dy = this.mChannelLayoutHeight + this.mChannelLayoutMargin;
        //   this.focusedEventPosition = this.getProgramPosition(channelPosition, this.getTimeFrom(this.getScrollX(false) + this.getWidth() / 2));

        //   if (channelPosition > (TVGuide.VISIBLE_CHANNEL_COUNT - TVGuide.VERTICAL_SCROLL_BOTTOM_PADDING_ITEM)) {
        //     if (channelPosition < (this.epgData.getChannelCount() - TVGuide.VERTICAL_SCROLL_BOTTOM_PADDING_ITEM)) {
        //       this.scrollY = this.getScrollY(false) + dy;
        //     }
        //   }
        //   console.log(channelPosition);
        //   if (channelPosition < this.getLastVisibleChannelPosition()) {
        //     this.focusedChannelPosition = channelPosition;
        //   }
        // }
        break;
      case 38:
        // channelPosition -= 1;
        // if (channelPosition >= 0) {

        //   dy = (-1) * (this.mChannelLayoutHeight + this.mChannelLayoutMargin);
        //   this.focusedEventPosition = this.getProgramPosition(channelPosition, this.getTimeFrom(this.getScrollX(false) + this.getWidth() / 2));
        //   if (channelPosition >= (TVGuide.VISIBLE_CHANNEL_COUNT - TVGuide.VERTICAL_SCROLL_TOP_PADDING_ITEM)) {

        //     if (this.epgData.getChannelCount() - channelPosition !== TVGuide.VERTICAL_SCROLL_TOP_PADDING_ITEM) {
        //       this.scrollY = this.getScrollY(false) + dy;
        //     }
        //   }
        //   console.log(channelPosition);
        //   this.focusedChannelPosition = channelPosition;
        // }
        break;

      case 406: // blue button show epg
        // if epg is shown don't show epg
        // if epg is not shown show epg
        break;
      case 403: // red button trigger recording
        // add current viewing channel to records
        // red button to trigger or cancel recording
        // get current event
        // this.focusedEvent = this.epgData.getEvent(channelPosition, programPosition);
        // if (this.focusedEvent.isPastDated(this.getNow())) {
        //   // past dated do nothing
        //   return;
        // }
        // // check if event is already marked for recording
        // let recEvent = this.epgData.getRecording(this.focusedEvent);
        // if (recEvent) {
        //   // cancel recording
        //   this.tvhDataService.cancelRec(recEvent, recordings => {
        //     this.epgData.updateRecordings(recordings);
        //     this.updateCanvas();
        //   });
        // } else { // creat new recording from event
        //   this.tvhDataService.createRec(this.focusedEvent, recordings => {
        //     this.epgData.updateRecordings(recordings);
        //     this.updateCanvas();
        //   });
        // }
        break;
      default:
        console.log("App-keyPressed:", keyCode);
    }
  };

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
          showEpgHandler={this.showEpgHandler} />
        <TVGuide ref="epg" epgData={this.epgData}
          imageCache={this.imageCache}
          showTvHandler={this.showTvHandler} />
      </div>
    );
  }
}
