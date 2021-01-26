import React, { useContext, useEffect } from 'react';
import TVHDataService from './services/TVHDataService';
import TV from './components/TV';
import TVHSettings, { STORAGE_TVH_SETTING_KEY } from './components/TVHSettings';
import './styles/app.css';
import AppContext from './AppContext';
import EPGChannel from './models/EPGChannel';

const App = () => {
    const {
        setLocale,
        isSettingsVisible,
        setSettingsVisible,
        tvhDataService,
        setTvhDataService,
        epgData,
        imageCache
    } = useContext(AppContext);

    const reloadData = async () => {
        if (tvhDataService) {
            // load locale
            loadLocale(tvhDataService);

            // retrieve channel infos etc
            const channels = await tvhDataService.retrieveM3UChannels();
            console.log('channels retrieved');
            console.log(channels);
            epgData.updateChannels(channels);

            // preload images
            preloadImages(channels);

            // force update to load/preload video already
            // this.forceUpdate();

            // retrieve epg and update channels
            tvhDataService.retrieveTVHEPG(0, (channels) => epgData.updateChannels(channels));

            // retrieve recordings and update channels
            tvhDataService.retrieveUpcomingRecordings((recordings) => epgData.updateRecordings(recordings));
        } else {
            setSettingsVisible(true);
            /*this.setState({
                isSettingsVisible: true
            });*/
        }
    };

    const loadLocale = async (tvhDataService: TVHDataService) => {
        try {
            // retrieve local info
            const localInfoResult = await tvhDataService.getLocaleInfo();
            const locale = localInfoResult.settings.localeInfo.locales.UI;
            setLocale(locale);
            console.log('Retrieved locale info:', locale);
        } catch (error) {
            console.log('Failed to retrieve locale info: ', error);
        }
    };

    /**
     * preload all images and set placeholders
     * if images cannot be loaded
     */
    const preloadImages = (channels: EPGChannel[]) => {
        channels.forEach((channel) => {
            const imageURL = channel.getImageURL();
            // logo url is optional
            if (!imageURL) {
                return;
            }
            const img = new Image();
            img.src = imageURL.toString();
            img.onload = () => {
                imageCache.set(imageURL, img);
            };
        });
    };

    const handleKeyPress = (event: React.KeyboardEvent<HTMLDivElement>) => {
        const keyCode = event.keyCode;

        switch (keyCode) {
            case 404: // green button
            case 71: //'g'
                event.stopPropagation();
                setSettingsVisible(true);
                break;
            default:
                console.log('App-keyPressed:', keyCode);
        }
    };

    useEffect(() => {
        console.log('app component mounted');
        const settingsString = localStorage.getItem(STORAGE_TVH_SETTING_KEY);
        const service = settingsString ? new TVHDataService(JSON.parse(settingsString)) : undefined;
        service && setTvhDataService(service);
    }, []);

    useEffect(() => {
        reloadData();
    }, [isSettingsVisible, tvhDataService]);

    return (
        <div className="app" onKeyDown={handleKeyPress}>
            {isSettingsVisible && <TVHSettings />}
            {!isSettingsVisible && epgData && <TV />}
        </div>
    );
};

export default App;
