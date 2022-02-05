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
     * - stream
     * - epg
     * - dvr
     */
    async testAll(): Promise<TestResults> {
        // test server info
        const serverInfoResult = this.testServerInfo();
        const epgResult = this.testEpg();
        const testDvr = this.testDvr();
        const playlistAndChannelStreamResult = this.testPlaylistAndChannelStream();

        const testResults: Promise<TestResults> = Promise.all([
            serverInfoResult,
            playlistAndChannelStreamResult,
            epgResult,
            testDvr
        ]).then(([serverInfo, { playlist, stream }, epg, dvr]) => {
            return { serverInfo, playlist, stream, epg, dvr };
        });

        return testResults;
    }

    testPlaylistAndChannelStream = async () => {
        const { playlistResult, streamUrl } = await this.testPlaylist();
        return this.testChannelStream(streamUrl).then((channelStreamResult) => {
            return { playlist: playlistResult, stream: channelStreamResult };
        });
    };

    testServerInfo = async () => {
        const serverInfoLabel = 'Server Info: ';

        return this.tvhService
            .retrieveServerInfo()
            .then((serverInfo) =>
                this.toResult(
                    serverInfoLabel,
                    true,
                    'Version: ' + serverInfo.sw_version + ' - API Version: ' + serverInfo.api_version,
                    serverInfo
                )
            )
            .catch((error) => this.toResult(serverInfoLabel, false, this.getErrorText(error)));
    };

    testPlaylist = async () => {
        const playListLabel = 'Playlist: ';

        return this.tvhService
            .retrieveM3UChannels()
            .then((channels) => {
                const streamUrl = channels[0] && channels[0].getStreamUrl();
                const resultItem = this.toResult(playListLabel, true, 'loaded ' + channels.length + ' channels');
                return { playlistResult: resultItem, streamUrl };
            })
            .catch((error) => {
                const resultItem = this.toResult(playListLabel, false, this.getErrorText(error));
                return { playlistResult: resultItem, streamUrl: null };
            });
    };

    testChannelStream = async (streamUrl: string | URL | null) => {
        const streamLabel = 'Stream: ';

        if (streamUrl) {
            // stream url is called via frontend (video element) and can therfore not provice any credentials
            // so our test needs to be without credentials
            return this.tvhService
                .retrieveTest(streamUrl, false)
                .then(() => this.toResult(streamLabel, true, 'verified access to video stream'))
                .catch((error) => this.toResult(streamLabel, false, this.getErrorTextStream(error)));
        } else {
            return this.toResult(
                streamLabel,
                false,
                'No channels available - verification of channel stream not possible'
            );
        }
    };

    testEpg = async () => {
        const epgLabel = 'EPG: ';

        return this.tvhService
            .retrieveTVEPGTest()
            .then(() => this.toResult(epgLabel, true, 'verified access to EPG'))
            .catch((error) => this.toResult(epgLabel, false, this.getErrorText(error)));
    };

    testDvr = async () => {
        const dvrLabel = 'DVR: ';

        return this.tvhService
            .retrieveDVRConfig()
            .then(() => this.toResult(dvrLabel, true, 'verified access to DVR'))
            .catch((error) => this.toResult(dvrLabel, false, this.getErrorText(error)));
    };

    private toResult(label: string, accessible: boolean, result: string, payload?: unknown): ResultItem {
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
            errorText = 'User is missing privileges to access the stream url';
        }
        return errorText;
    }
}
