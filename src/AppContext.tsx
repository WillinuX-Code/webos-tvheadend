import React, { createContext, useState } from 'react';
import EPGData from './models/EPGData';
import TVHDataService from './services/TVHDataService';

type AppContext = {
    locale: string;
    setLocale: (value: string) => void;
    isSettingsVisible: boolean;
    setSettingsVisible: (value: boolean) => void;
    tvhDataService?: TVHDataService;
    setTvhDataService: (value: TVHDataService) => void;
    epgData: EPGData;
    imageCache: Map<URL, HTMLImageElement>;
    currentChannelPosition: number;
    setCurrentChannelPosition: (value: number) => void;
};

const AppContext = createContext({} as AppContext);

export const AppContextProvider = ({ children }: { children: JSX.Element }) => {
    const [locale, setLocale] = useState('en-US');
    const [isSettingsVisible, setSettingsVisible] = useState(false);
    const [tvhDataService, setTvhDataService] = useState<TVHDataService>();
    const [epgData] = useState(new EPGData());
    const [imageCache] = useState(new Map<URL, HTMLImageElement>());
    const [currentChannelPosition, setCurrentChannelPosition] = useState(0);
    
    const appContext: AppContext = {
        locale: locale,
        setLocale: (value: string) => setLocale(value),
        isSettingsVisible: isSettingsVisible,
        setSettingsVisible: (value: boolean) => setSettingsVisible(value),
        tvhDataService: tvhDataService,
        setTvhDataService: (value: TVHDataService) => setTvhDataService(value),
        epgData: epgData,
        imageCache: imageCache,
        currentChannelPosition: currentChannelPosition,
        setCurrentChannelPosition: (value: number) => setCurrentChannelPosition(value)
    };

    return <AppContext.Provider value={appContext}>{children}</AppContext.Provider>;
};

export default AppContext;