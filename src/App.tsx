import React, { useContext, useEffect, useState } from 'react';
import TVHDataService from './services/TVHDataService';
import TV from './components/TV';
import TVHSettings from './components/TVHSettings';
import './styles/app.css';
import AppContext, { AppState } from './AppContext';
import EPGChannel from './models/EPGChannel';
import StorageHelper from './utils/StorageHelper';

const App = () => {
    const { setAppState, setLocale, tvhDataService, setTvhDataService, epgData, imageCache } = useContext(AppContext);

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
        const tvhSettings = StorageHelper.getTvhSettings();
        const service = tvhSettings ? new TVHDataService(tvhSettings) : undefined;
        setTvhDataService(service);

        // add global event listeners for blur and focus of the app
        window.onblur = handleBlur;
        window.onfocus = handleFocus;

        // add global event listener for visibility change of the app
        document.onvisibilitychange = handleVisibilityChange;
    }, []);

    const handleBlur = (event: FocusEvent) => {
        event.stopPropagation();
        console.log('app is blurred');
        setAppState(AppState.BLURRED);
    };

    const handleFocus = (event: FocusEvent) => {
        event.stopPropagation();
        console.log('app is focused');
        setAppState(AppState.FOCUSED);
    };

    const handleVisibilityChange = (event: Event) => {
        event.stopPropagation();
        if (document.hidden) {
            console.log('app is in background');
            setAppState(AppState.BACKGROUND);
        } else {
            console.log('app is in foreground');
            setAppState(AppState.FOREGROUND);
        }
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
