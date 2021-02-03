import React, { createContext, useState } from 'react';
import EPGData from './models/EPGData';
import TVHDataService from './services/TVHDataService';
import StorageHelper from './utils/StorageHelper';

export enum AppVisibilityState {
    FOCUSED = 'focused',
    BLURRED = 'blurred',
    BACKGROUND = 'background',
    FOREGROUND = 'foreground'
}

type AppContext = {
    locale: string;
    setLocale: (value: string) => void;
    tvhDataService?: TVHDataService;
    setTvhDataService: (value?: TVHDataService) => void;
    epgData: EPGData;
    imageCache: Map<URL, HTMLImageElement>;
    currentChannelPosition: number;
    setCurrentChannelPosition: (value: number) => void;
    appVisibilityState: AppVisibilityState;
    setAppVisibilityState: (value: AppVisibilityState) => void;
};

const AppContext = createContext({} as AppContext);

export const AppContextProvider = ({ children }: { children: JSX.Element }) => {
    const [locale, setLocale] = useState('en-US');
    const [tvhDataService, setTvhDataService] = useState<TVHDataService>();
    const [epgData] = useState(new EPGData());
    const [imageCache] = useState(new Map<URL, HTMLImageElement>());
    const [currentChannelPosition, setCurrentChannelPosition] = useState(StorageHelper.getLastChannelIndex());
    const [appVisibilityState, setAppState] = useState(AppVisibilityState.FOCUSED);

    const appContext: AppContext = {
        locale: locale,
        setLocale: (value: string) => setLocale(value),
        tvhDataService: tvhDataService,
        setTvhDataService: (value?: TVHDataService) => setTvhDataService(value),
        epgData: epgData,
        imageCache: imageCache,
        currentChannelPosition: currentChannelPosition,
        setCurrentChannelPosition: (value: number) => setCurrentChannelPosition(value),
        appVisibilityState: appVisibilityState,
        setAppVisibilityState: (value: AppVisibilityState) => setAppState(value)
    };

    return <AppContext.Provider value={appContext}>{children}</AppContext.Provider>;
};

export default AppContext;
