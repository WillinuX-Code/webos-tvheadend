import Button from '@enact/moonstone/Button';
import Spinner from '@enact/moonstone/Spinner';
import Input from '@enact/moonstone/Input';
import { Header, Panel } from '@enact/moonstone/Panels';
import Heading from '@enact/moonstone/Heading';
import React, { useContext, useEffect, useRef, useState } from 'react';
import TVHDataService, { TVHDataServiceParms } from '../services/TVHDataService';
import TVHSettingsTest, { TestResults } from '../utils/TVHSettingsTest';
import AppContext from '../AppContext';
import TestResult from './TestResult';
import StorageHelper from '../utils/StorageHelper';

const TVHSettings = (props: { unmount: () => void }) => {
    const { tvhDataService, setTvhDataService } = useContext(AppContext);
    const [isValid, setIsValid] = useState(false);
    const [isConnectButtonEnabled, setConnectButtonEnabled] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
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
        StorageHelper.setTvhSettings(serviceParms);
        setTvhDataService(new TVHDataService(serviceParms));
        props.unmount();
    };

    const handleUserChange = (input: HTMLInputElement) => {
        setServiceParms({ ...serviceParms, user: input.value });
        setIsValid(false);
        setConnectButtonEnabled(input.value.length > 0);
    };

    const handlePasswordChange = (input: HTMLInputElement) => {
        setServiceParms({ ...serviceParms, password: input.value });
        setIsValid(false);
        setConnectButtonEnabled(input.value.length > 0);
    };

    const handleUrlChange = (input: HTMLInputElement) => {
        setServiceParms({ ...serviceParms, tvhUrl: input.value });
        setIsValid(false);
        setConnectButtonEnabled(input.value.length > 0);
    };

    const getDataService = () => {
        return new TVHDataService(serviceParms);
    };

    const handleConnectionTest = async () => {
        setIsLoading(true);
        setTestResults(undefined);

        //test url verify if it works
        const service = getDataService();
        const tester = new TVHSettingsTest(service);
        const result = await tester.testAll();

        setTestResults({ ...result });
        setServiceParms({ ...serviceParms, dvrUuid: testResults?.dvr.payload });
        setConnectButtonEnabled(true);
        setIsLoading(false);
    };

    const isValidSetup = () => {
        return (
            (testResults?.serverInfo.accessible && testResults.playlist.accessible && testResults.stream.accessible) ||
            false
        );
    };

    useEffect(() => {
        // read state from storage if exists
        const settings = StorageHelper.getTvhSettings() || ({} as TVHDataServiceParms);
        setServiceParms(settings);
        focus();
    }, []);

    useEffect(() => {
        // get current connection info, if possible
        tvhDataService && !testResults && serviceParms.tvhUrl && handleConnectionTest();
    }, [serviceParms]);

    useEffect(() => {
        setIsValid(isValidSetup());
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
                    type="password"
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
                <Button disabled={!isValid} backgroundOpacity="lightTranslucent" onClick={handleSave}>
                    Save
                </Button>
                <br /> <br />
                {testResults && (
                    <>
                        <Heading spacing="auto">Connection Test Results</Heading>
                        <TestResult {...testResults} />
                    </>
                )}
            </Panel>
        </div>
    );
};

export default TVHSettings;
