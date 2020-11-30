# webos-tvheadend
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
https://oberguru.net/tvheadend/api.html

##### API call epg
http://userver.fritz.box:9981/api/epg/events/grid?start=0&limit=50
* start: pages starting with 0
* limit: entries per page
```json 
"totalCount": 20110,
    "entries": [
        {
            "eventId": 67951901,
            "channelName": "Sky Sport 3 HD",
            "channelUuid": "b24ee026804043fda3f908e0495a15d9",
            "channelNumber": "53",
            "channelIcon": "imagecache/7117",
            "start": 1606712400,
            "stop": 1606798800,
            "title": "Sendepause",
            "subtitle": "Momentan kein Programm",
            "description": " ",
            "widescreen": 1,
            "hd": 1,
            "nextEventId": 67954261
        },
        {
            "eventId": 67956020,
            "channelName": "BBC World News Europe HD",
            "channelUuid": "1a95aa58e128594a42feb3ea128f6b3d",
            "channelNumber": "93",
            "channelIcon": "imagecache/7081",
            "start": 1606712400,
            "stop": 1606798800,
            "title": "BBC WORLD HD",
            "description": "Canal de informaciðn 24 horas, producido por la BBC que emite en inglØs en mÆs de 200 paŦses alrededor del mundo. ",
            "nextEventId": 67959199
        },
        ...
```

##### API call recordings
http://userver.fritz.box:9981/api/dvr/entry/create_by_event
* create record event by epg id
* param: event_id
* param: config_uuid
* param: comment <optional>

http://userver.fritz.box:9981/api/dvr/entry/stop
* Stop active recording gracefully
* TODO params

http://userver.fritz.box:9981/api/dvr/entry/cancel 
* Cancel scheduled or active recording
* TODO params 
