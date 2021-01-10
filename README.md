# webos-tvheadend

## Build
Normal build without webos running
* TVGuides.js:getNow() needs to return 1607462851000 as mock timestamp for now
* TVHDataService:constructor() needs to use MockServiceAdapter instead of LunaServiceAdapter
```s
npm run start
```
* Device Setup
```s
name      deviceinfo                    connection  profile
--------  ----------------------------  ----------  -------
emulator  developer@127.0.0.1:6622      ssh         tv
tv        prisoner@192.168.178.22:9922  ssh         tv
```

Deployment to emulator/webos
```s
npm run webos:emu
npm run webos:tv

# for debugging attach to device
ares-inspect -d emulator com.willinux.tvh.app --open
ares-inspect -d tv com.willinux.tvh.app --open
```
## Goal
Create a tvheadend client for WebOS which 
1) Allows playback of channels configured in tvheadend
2) Integrates epg information from tvheadend
3) uses the epg and tvheadends api to plan recordings 

## WebOS
Useful links for video playback using webos

* http://webostv.developer.lge.com/develop/app-developer-guide/resuming-media-quickly-mediaoption/
* http://webostv.developer.lge.com/api/web-api/mediaoption-parameter/

## tvheadend
##### Example for stream url
http://userver.fritz.box:9981/stream/channelid/1241288599?profile=pass

##### Retrieve m3u list (with optional profile)
http://userver.fritz.box:9981/playlist/channels.m3u?profile=pass
```sh
#EXTINF:-1 logo="http://userver.fritz.box:9981/imagecache/7167" tvg-id="978ffcc9bede159db867631b28b2ce0a" tvg-chno="1",Das Erste HD
http://userver.fritz.box:9981/stream/channelid/1241288599?profile=pass
#EXTINF:-1 logo="http://userver.fritz.box:9981/imagecache/7166" tvg-id="f2ceba520639ad0ffaaf030edc7453ee" tvg-chno="2",ZDF HD
http://userver.fritz.box:9981/stream/channelid/1387974386?profile=pass
```

#### API documentation
https://github.com/dave-p/TVH-API-docs/wiki
