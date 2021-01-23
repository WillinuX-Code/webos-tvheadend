import TVHDataService from '../services/TVHDataService';

export interface TestResults {
    serverInfo: ResultItem;
    playlist: ResultItem;
    stream: ResultItem;
    epg: ResultItem;
    dvr: ResultItem;
}

export interface ResultItem {
    label: string;
    accessible: boolean;
    result: string;
    payload: any;
}

export default class TVHSettingsTest {
    private tvhService: TVHDataService;

    constructor(tvhService: TVHDataService) {
        this.tvhService = tvhService;
    }

    /**
     * test
     * - server info
     * - playlist
     * - tream
     */
    async testSeveral(): Promise<ResultItem[]> {
        const serverInfoLabel = 'Server Info: ';
        const playListLabel = 'Playlist: ';
        const streamLabel = 'Stream: ';
        let channels;
        let serverInfo;
        let serverInfoResult;
        let playlistResult;
        let channelStreamResult;

        // test server info
        try {
            serverInfo = await this.tvhService.retrieveServerInfo();
            serverInfoResult = this.toResult(
                serverInfoLabel,
                true,
                'Version: ' + serverInfo.sw_version + ' - API Version: ' + serverInfo.api_version,
                serverInfo
            );
        } catch (error) {
            serverInfoResult = this.toResult(serverInfoLabel, false, this.getErrorText(error));
        }
        // test playlist
        try {
            channels = await this.tvhService.retrieveM3UChannels();
            playlistResult = this.toResult(playListLabel, true, 'loaded ' + channels.length + ' channels');
        } catch (error) {
            playlistResult = this.toResult(playListLabel, false, this.getErrorText(error));
        }
        // test access to stream
        // test playlist
        if (channels && channels.length > 0) {
            const streamUrl = channels[0].getStreamUrl();
            try {
                // stream url is called via frontend (video element) and can therfore not provice any credentials
                // so our test needs to be without credentials
                await this.tvhService.retrieveTest(streamUrl, false);
                channelStreamResult = this.toResult(streamLabel, true, 'verified access to video stream');
            } catch (error) {
                channelStreamResult = this.toResult(streamLabel, false, this.getErrorTextStream(error));
            }
        } else {
            channelStreamResult = this.toResult(
                streamLabel,
                false,
                'No channels available - verification of channel stream not possible'
            );
        }
        return [serverInfoResult, playlistResult, channelStreamResult];
    }

    async testEpg(): Promise<ResultItem> {
        const label = 'EPG: ';
        try {
            await this.tvhService.retrieveTVEPGTest();
            return this.toResult(label, true, 'verified access to EPG');
        } catch (error) {
            return this.toResult(label, false, this.getErrorText(error));
        }
    }

    async testDvr(): Promise<ResultItem> {
        const label = 'DVR: ';
        try {
            const dvrConfig = await this.tvhService.retrieveDVRConfig();
            return this.toResult(label, true, 'verified access to DVR', dvrConfig);
        } catch (error) {
            return this.toResult(label, false, this.getErrorText(error));
        }
    }

    toResult(label: string, accessible: boolean, result: string, payload?: any): ResultItem {
        return {
            label: label,
            accessible: accessible,
            result: result,
            payload: payload
        };
    }

    private getErrorText(error: any): string {
        const isUnauthorized = error.statusCode && error.statusCode === 401;
        const isForbidden = error.statusCode && error.statusCode === 403;
        let errorText = error.errorText || error.message;
        if (isUnauthorized) {
            errorText = 'User authentication is required or provided user/password is wrong';
        }
        if (isForbidden) {
            errorText = 'User is missing privileges please verify user setup in tvheadend';
        }
        return errorText;
    }

    private getErrorTextStream(error: any): string {
        const isUnauthorized = error.statusCode && error.statusCode === 401;
        const isForbidden = error.statusCode && error.statusCode === 403;
        let errorText = error.errorText || error.message;
        if (isUnauthorized) {
            errorText =
                'Using Version 4.3 with User Authentication requires activation of "Persistence Token" in the Users Password setttings of TVHeadend';
        }
        if (isForbidden) {
            errorText = 'User is missing privileges to acces the stream url';
        }
        return errorText;
    }
}
