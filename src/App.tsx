import React, { useContext, useEffect, useState } from 'react';
import TVHDataService from './services/TVHDataService';
import TV from './components/TV';
import TVHSettings, { STORAGE_TVH_SETTING_KEY } from './components/TVHSettings';
import './styles/app.css';
import AppContext from './AppContext';
import EPGChannel from './models/EPGChannel';

const App = () => {
    const { setIsAppFocused, setLocale, tvhDataService, setTvhDataService, epgData, imageCache } = useContext(AppContext);

    const [isSettingsVisible, setIsSettingsVisible] = useState(false);
    const [isEpgDataLoaded, setIsEpgDataLoaded] = useState(false);

    const reloadData = () => {
        if (tvhDataService) {
            // load locale
            loadLocale(tvhDataService);

            // retrieve channel infos etc
            tvhDataService.retrieveM3UChannels().then((channels) => {
                epgData.updateChannels(channels);
                setIsEpgDataLoaded(true);

                // preload images
                preloadImages(channels);

                // retrieve epg and update channels
                tvhDataService.retrieveTVHEPG(0, (channels) => {
                    epgData.updateChannels(channels);
                });

                // retrieve recordings and update channels
                tvhDataService.retrieveUpcomingRecordings((recordings) => {
                    epgData.updateRecordings(recordings);
                });
            });

            setIsSettingsVisible(false);
        } else {
            setIsSettingsVisible(true);
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
                setIsSettingsVisible(!isSettingsVisible);
                break;
            default:
                console.log('App-keyPressed:', keyCode);
        }
    };

    useEffect(() => {
        console.log('app component mounted');
        const settingsString = localStorage.getItem(STORAGE_TVH_SETTING_KEY);
        const service = settingsString ? new TVHDataService(JSON.parse(settingsString)) : undefined;
        setTvhDataService(service);

        // add global event listeners for blur and focus of the app
        window.addEventListener('blur', handleBlur, false);
        window.addEventListener('focus', handleFocus, false);
    }, []);

    const handleBlur = () => {
        console.log('blurred');
        setIsAppFocused(false);
    };

    const handleFocus = () => {
        console.log('focused');
        setIsAppFocused(true);
    };

    useEffect(() => {
        reloadData();
    }, [tvhDataService]);

    return (
        <div className="app" onKeyDown={handleKeyPress}>
            {isSettingsVisible && <TVHSettings unmount={() => setIsSettingsVisible(false)} />}
            {!isSettingsVisible && isEpgDataLoaded && <TV />}
        </div>
    );
};

export default App;
