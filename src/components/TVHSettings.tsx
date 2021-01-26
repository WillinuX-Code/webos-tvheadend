import Button from '@enact/moonstone/Button';
import Spinner from '@enact/moonstone/Spinner';
import Input from '@enact/moonstone/Input';
import { Header, Panel } from '@enact/moonstone/Panels';
import Heading from '@enact/moonstone/Heading';
import React, { useContext, useEffect, useRef, useState } from 'react';
import TVHDataService, { TVHDataServiceParms } from '../services/TVHDataService';
import TVHSettingsTest, { TestResults } from './TVHSettingsTest';
import Icon from '@enact/moonstone/Icon';
import AppContext from '../AppContext';
import TestResult from './TestResult';

export const STORAGE_TVH_SETTING_KEY = 'TVH_SETTINGS';

const TVHSettings = () => {
    const { tvhDataService, setSettingsVisible } = useContext(AppContext);
    const [connectionStatus, setConnectionStatus] = useState('');
    const [isValid, setValid] = useState(false);
    const [isConnectButtonEnabled, setConnectButtonEnabled] = useState(false);
    const [isLoading, setLoading] = useState(false);
    const [testResults, setTestResults] = useState<TestResults>();
    const [serviceParms, setServiceParms] = useState<TVHDataServiceParms>({
        tvhUrl: '',
        user: '',
        password: '',
        dvrUuid: 0
    });
    const tvhSettingsWrapper = useRef<HTMLDivElement>(null);

    const focus = () => tvhSettingsWrapper.current?.focus();

    const handleSave = () => {
        // put to storage
        localStorage.setItem(STORAGE_TVH_SETTING_KEY, JSON.stringify(serviceParms));

        setSettingsVisible(false);
    };

    const handleUserChange = (event: any) => {
        setServiceParms({ ...serviceParms, user: event.value });
        setValid(false);
        setConnectButtonEnabled(event.value.length > 0);
    };

    const handlePasswordChange = (event: any) => {
        setServiceParms({ ...serviceParms, password: event.value });
        setValid(false);
        setConnectButtonEnabled(event.value.length > 0);
    };

    const handleUrlChange = (event: any) => {
        setConnectionStatus('');
        setServiceParms({ ...serviceParms, tvhUrl: event.value });
        setValid(false);
        setConnectButtonEnabled(event.value.length > 0);
    };

    const getDataService = () => {
        return new TVHDataService(serviceParms);
    };

    const handleConnectionTest = async () => {
        setLoading(true);

        //test url verify if it works
        const service = getDataService();
        const tester = new TVHSettingsTest(service);

        try {
            // TODO: reimplement this
            // retrieve server info
            const severalResults = await tester.testSeveral();
            setTestResults({
                ...testResults,
                serverInfo: severalResults[0],
                playlist: severalResults[1],
                stream: severalResults[2],
                epg: await tester.testEpg(),
                dvr: await tester.testDvr()
            });

            // retrieve server info
            //let serverInfoResult = await service.retrieveServerInfo();
            //this.testResult = 'Version: ' + serverInfoResult.result.sw_version + ' - API Version: ' + serverInfoResult.result.api_version;
            getConnectionInfo(service);

            // TODO profile is not required anymore (already inlcuded in m3u list)
            // let profilesResult = await service.retrieveProfileList();
            // let profiles: string[] = [];
            // profilesResult.entries.forEach((entry: any) => {
            //     profiles.push(entry.val);
            // });
            // move "pass" profile to beginning of array
            // if (profiles.indexOf('pass') > 0) {
            //     profiles.splice(profiles.indexOf('pass'), 1);
            //     profiles.unshift('pass');
            // }
            // retrieve channel tags
            //let tvChannelTagUuid = await service.retrieveTvChannelTag();
            // retrieve the default dvr config

            //setDvrUuid(await service.retrieveDVRConfig());
            setServiceParms({ ...serviceParms, dvrUuid: await service.retrieveDVRConfig() });
            setConnectButtonEnabled(true);
            setLoading(false);
        } catch (error) {
            // this.testResult = 'Failed to connect: ' + (error.errorText ? error.errorText : error);
            setLoading(false);
            setValid(false);
        }
    };

    const isValidSetup = () => {
        return (
            (testResults?.serverInfo.accessible && testResults.playlist.accessible && testResults.stream.accessible) ||
            false
        );
    };

    const getConnectionInfo = async (service: TVHDataService) => {
        try {
            const serverInfoResult = await service.retrieveServerInfo();
            setConnectionStatus(
                'Version: ' + serverInfoResult.sw_version + ' - API Version: ' + serverInfoResult.api_version
            );
            setLoading(false);
            setValid(true);
        } catch (error) {
            setConnectionStatus('Failed to connect: ' + (error.errorText ? error.errorText : error));
            setLoading(false);
            setValid(false);
        }
    };

    useEffect(() => {
        // read state from storage if exists
        const settings = JSON.parse(localStorage.getItem(STORAGE_TVH_SETTING_KEY) || '') as TVHDataServiceParms;

        //setTvhUrl(settings.tvhUrl);
        //setPassword(settings.password);
        //setUser(settings.user);
        //setDvrUuid(settings.dvrUuid);
        setServiceParms(settings);

        focus();
    }, []);

    useEffect(() => {
        // get current connection info, if possible
        tvhDataService && !testResults && serviceParms.tvhUrl && handleConnectionTest();
    }, [serviceParms]);

    useEffect(() => {
        setValid(isValidSetup());
    }, [testResults]);

    return (
        <div id="tvh-settings" ref={tvhSettingsWrapper} tabIndex={-1} className="tvhSettings">
            <Panel>
                <Header title="TVheadend Setup" type="compact" centered />
                <Heading spacing="auto">TVheadend URL</Heading>
                <Input
                    value={serviceParms.tvhUrl}
                    type="url"
                    onChange={handleUrlChange}
                    placeholder="http://192.168.0.10:9981/"
                />
                <Input
                    className="username"
                    value={serviceParms.user}
                    type="text"
                    onChange={handleUserChange}
                    placeholder="User (Optional)"
                />
                <Input
                    className="password"
                    value={serviceParms.password}
                    type="text"
                    onChange={handlePasswordChange}
                    placeholder="Password (Optional)"
                />
                <br /> <br />
                {!isLoading && (
                    <Button
                        disabled={!isConnectButtonEnabled}
                        backgroundOpacity="lightTranslucent"
                        onClick={handleConnectionTest}
                    >
                        Connect
                    </Button>
                )}
                {isLoading && <Spinner component={Panel} size="medium" />}
                <br /> <br />
                <Heading spacing="auto">Connection Status</Heading>
                {connectionStatus.length === 0 && <Icon>question</Icon>}
                {connectionStatus.length > 0 && (
                    <>
                        {isValid && <Icon>check</Icon>}
                        {!isValid && <Icon>warning</Icon>}
                        {connectionStatus}
                    </>
                )}
                {/*this.state.profiles.length > 0 &&
                        <>
                            <br /> <br />
                            <Heading spacing="auto">Stream profile</Heading>
                            <Picker defaultValue={this.state.profiles.indexOf(this.state.selectedProfile)} onChange={this.handleProfileChange} width="medium">
                                {this.state.profiles}
                            </Picker>
                        </>
                    */}
                <br /> <br />
                <Button disabled={!isValid} backgroundOpacity="lightTranslucent" onClick={handleSave}>
                    Save
                </Button>
                <br /> <br />
                {connectionStatus.length > 0 && testResults && <Heading spacing="auto">Connection Test Results</Heading>}
                {connectionStatus.length > 0 && testResults && <TestResult {...testResults} />}
            </Panel>
        </div>
    );
};

export default TVHSettings;
