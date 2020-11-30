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
##### Retrieve full epg xml
http://userver.fritz.box:9981/xmltv/channels
```xml
<tv generator-info-name="TVHeadend-4.3-1914~g214a14f29" source-info-name="tvh-Tvheadend">
    <channel id="178b5500a440df9ec58fcaaaf17485c8">
        <display-name>SAT.1 HD</display-name>
        <display-name>7</display-name>
        <icon src="http://userver.fritz.box:9981/imagecache/7161"/>
    </channel>
    <channel id="4abc5600e83c873b1de73920fbb112a3">
        <display-name>Sky Cinema Premieren HD</display-name>
        <display-name>33</display-name>
        <icon src="http://userver.fritz.box:9981/imagecache/7135"/>
    </channel>
    ...
    <programme start="20201130201434 +0100" stop="20201130223002 +0100" channel="178b5500a440df9ec58fcaaaf17485c8">
        <title>Sister Act 2 - In göttlicher Mission</title>
        <sub-title>Sister Act 2 - In göttlicher Mission Komödie, USA 1993</sub-title>
        <desc>Auf Bitten ihrer Freundinnen aus dem Kloster wirft sich Las Vegas-Sängerin Deloris Van Cartier erneut in die Soutane, um als "Schwester Mary Clarence" eine Bande ausgerasteter Kids und die in Finanznot geratene Schule unter Kontrolle zu bringen. Eine harte Nuss, wie sich bald herausstellt ... Regie: Bill Duke Drehbuch: James Orr, Jim Cruickshank, Judi Ann Mason Komponist: Miles Goodman, Mervyn Warren Kamera: Oliver Wood Schnitt: John Carter, Pembroke J. Herring, Stuart H. Pappe Darsteller: Whoopi Goldberg (Deloris Van Cartier / Schwester Mary Clarence) Kathy Najimy (Schwester Mary Patrick) Barnard Hughes (Pater Maurice) Mary Wickes (Schwester Mary Lazarus) James Coburn (Mr. Crisp) Michael Jeter (Pater Ignatius) Maggie Smith (Mutter Oberin) Wendy Makkena (Schwester Mary Robert) Thomas Gottschalk (Pater Wolfgang)</desc>
    </programme>
    <programme start="20201203235000 +0100" stop="20201204000500 +0100" channel="0934d77f17e8b019774e6975f34987d6">
        <title>Robot Chicken</title>
        <sub-title>Neo wills wissen</sub-title>
        <desc>10. Staffel, Folge 14: Tyrion Lennister verlangt ein "Urteil durch Quiz". Während Blade versucht, ein ganz bestimmtes Produkt zu verkaufen, geht der Inside-Out-Boy aufs College. Zudem stellen sich die Schöpfer der Serie die Frage, wie es wohl aussehen würde, wenn die Filmreihe "Halloween" auf "Kevin - Allein zu Haus" treffen würde. 15 Min. 2020. Ab 16 Jahren</desc>
        <category lang="en">Movie / Drama : Soap / Melodrama / Folkloric</category>
    </programme>
    ...
```

##### API call channels (including ids)
http://userver.fritz.box:9981/api/channel/list
```json
{
    "entries": [
        {
            "key": "978ffcc9bede159db867631b28b2ce0a",
            "val": "Das Erste HD"
        },
        ...
```

##### API call channels grid
http://userver.fritz.box:9981/api/channel/grid
```json 
"entries": [
        {
            "uuid": "178b5500a440df9ec58fcaaaf17485c8",
            "enabled": true,
            "autoname": true,
            "name": "SAT.1 HD",
            "number": 7,
            "icon": "file:///config/picons/snp/sat1hd.png",
            "icon_public_url": "imagecache/7161",
            "epgauto": true,
            "epglimit": 0,
            "epggrab": [],
            "dvr_pre_time": 0,
            "dvr_pst_time": 0,
            "epg_running": -1,
            "services": [
                "cdd8701d039ee0722f3080ade0ffb0df"
            ],
            "tags": [
                "9457a9fa922a3f4b3a5e2affcaa6c091",
                "ac291c2414188cb42d712138060f30d8"
            ],
            "bouquet": ""
        },
        ...
```
