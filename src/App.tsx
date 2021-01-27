import React, { useContext, useEffect, useState } from 'react';
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

    const [isEpgDataLoaded, setEpgDataLoaded] = useState(false);

    const reloadData = () => {
        if (tvhDataService) {
            // load locale
            loadLocale(tvhDataService);

            // retrieve channel infos etc
            tvhDataService.retrieveM3UChannels().then((channels) => {
                epgData.updateChannels(channels);
                setEpgDataLoaded(true);

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

            setSettingsVisible(false);
        } else {
            setSettingsVisible(true);
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
                setSettingsVisible(!isSettingsVisible);
                break;
            default:
                console.log('App-keyPressed:', keyCode);
        }
    };

    const setupTvhService = () => {
        const settingsString = localStorage.getItem(STORAGE_TVH_SETTING_KEY);
        const service = settingsString ? new TVHDataService(JSON.parse(settingsString)) : undefined;
        setTvhDataService(service);
    };

    useEffect(() => {
        console.log('app component mounted');
        setupTvhService();
    }, []);

    useEffect(() => {
        console.log('app settings closed');
        setupTvhService();
    }, [isSettingsVisible]);

    useEffect(() => {
        reloadData();
    }, [tvhDataService]);

    return (
        <div className="app" onKeyDown={handleKeyPress}>
            {isSettingsVisible && <TVHSettings />}
            {!isSettingsVisible && isEpgDataLoaded && <TV />}
        </div>
    );
};

export default App;
