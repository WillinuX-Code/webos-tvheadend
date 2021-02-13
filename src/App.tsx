import React, { useContext, useEffect, useState } from 'react';
import TVHDataService from './services/TVHDataService';
import TV from './components/TV';
import Player from './components/Player';
import TVHSettings from './components/TVHSettings';
import './styles/app.css';
import AppContext, { AppVisibilityState } from './AppContext';
import EPGChannel from './models/EPGChannel';
import StorageHelper from './utils/StorageHelper';
import Menu, { MenuItem } from './components/Menu';

export enum AppViewState {
    TV,
    SETTINGS,
    RECORDINGS,
    HELP,
    CONTACT
}

const App = () => {
    const {
        menuState,
        setMenuState,
        appViewState,
        setAppViewState,
        setAppVisibilityState,
        setLocale,
        tvhDataService,
        setTvhDataService,
        epgData,
        imageCache,
        setPersistentAuthToken
    } = useContext(AppContext);

    const [isChannelsRetrieved, setIsChannelsRetrieved] = useState(false);

    const isWebKit = typeof document['hidden'] === 'undefined';

    const menu: MenuItem[] = [
        {
            icon: 'liveplayback',
            label: 'TV',
            action: () => updateAppViewState(AppViewState.TV),
            isActive: appViewState === AppViewState.TV
        },
        {
            icon: 'recordings',
            label: 'Recordings',
            action: () => updateAppViewState(AppViewState.RECORDINGS),
            isActive: appViewState === AppViewState.RECORDINGS
        },
        {
            icon: 'gear',
            label: 'Setup',
            action: () => updateAppViewState(AppViewState.SETTINGS),
            isActive: appViewState === AppViewState.SETTINGS
        },
        {
            icon: 'denselist',
            label: 'Help',
            action: () => console.log('not yet available') /*action: () => updateAppViewState(AppViewState.HELP)*/,
            isActive: false
        },
        {
            icon: 'circle',
            label: 'Contact',
            action: () => console.log('not yet available') /*action: () => updateAppViewState(AppViewState.CONTACT)*/,
            isActive: false
        }
    ];

    const updateAppViewState = (appViewState: AppViewState) => {
        setMenuState(false);
        setAppViewState(appViewState);
    };

    const reloadData = () => {
        if (tvhDataService) {
            // load locale
            loadLocale(tvhDataService);

            // retrieve channel infos etc
            setIsChannelsRetrieved(false);
            tvhDataService.retrieveM3UChannels().then((channels) => {
                epgData.updateChannels(channels);
                setIsChannelsRetrieved(true);

                // safe persistent token if available
                if (channels.length > 0) {
                    safePersistentAuthToken(channels[0].getStreamUrl());
                }
                // preload images
                preloadImages(channels);

                // retrieve epg and update channels
                tvhDataService.retrieveTVHEPG(0, (channels) => {
                    // note: channels are already updated as we are working on references here
                    epgData.updateChannels(channels);
                });

                // retrieve recordings and update channels
                tvhDataService.retrieveUpcomingRecordings((recordings) => {
                    epgData.updateRecordings(recordings);
                });
            });

            setAppViewState(AppViewState.TV);
        } else {
            setAppViewState(AppViewState.SETTINGS);
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

    const safePersistentAuthToken = (url: URL) => {
        const authParam = url.searchParams.get('auth');
        if (authParam) {
            // put auth token to app context
            setPersistentAuthToken(authParam.trim());
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
                setMenuState(!menuState);
                break;
            case 461: // back button
            case 66: // 'b'
                event.stopPropagation();
                if (menuState) {
                    setMenuState(false);
                }
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
        window.addEventListener('blur', handleBlur);
        window.addEventListener('focus', handleFocus);

        // add global event listener for visibility change of the app
        document.addEventListener(isWebKit ? 'webkitvisibilitychange' : 'visibilitychange', handleVisibilityChange);

        // webOSLaunch event
        document.addEventListener('webOSLaunch', handleWebOSLaunch);

        // webOSRelaunch event
        document.addEventListener('webOSRelaunch', handleWebOSRelaunch);
    }, []);

    const handleBlur = (event: FocusEvent) => {
        event.stopPropagation();
        console.log('app is blurred');
        setAppVisibilityState(AppVisibilityState.BLURRED);
    };

    const handleFocus = (event: FocusEvent) => {
        event.stopPropagation();
        console.log('app is focused');
        setAppVisibilityState(AppVisibilityState.FOCUSED);
    };

    const handleVisibilityChange = (event: Event) => {
        event.stopPropagation();

        if (isWebKit ? (document as any)['webkitHidden'] : document['hidden']) {
            console.log('app is in background');
            setAppVisibilityState(AppVisibilityState.BACKGROUND);
        } else {
            console.log('app is in foreground');
            setAppVisibilityState(AppVisibilityState.FOREGROUND);
        }
    };

    // for future use
    const handleWebOSLaunch = () => {
        console.log('app is launched');
    };

    // for future use
    const handleWebOSRelaunch = () => {
        console.log('app is relaunched');
    };

    useEffect(() => {
        reloadData();
    }, [tvhDataService]);

    return (
        <div className="app" onKeyDown={handleKeyPress}>
            {menuState && <Menu items={menu} unmount={() => setAppViewState(AppViewState.TV)} />}
            {appViewState === AppViewState.SETTINGS && <TVHSettings unmount={() => setAppViewState(AppViewState.TV)} />}
            {appViewState === AppViewState.TV && isChannelsRetrieved && <TV />}
            {appViewState === AppViewState.RECORDINGS && <Player />}
        </div>
    );
};

export default App;
