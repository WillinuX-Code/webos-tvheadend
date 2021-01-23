import Button from '@enact/moonstone/Button';
import Spinner from '@enact/moonstone/Spinner';
import Input from '@enact/moonstone/Input';
import { Header, Panel } from '@enact/moonstone/Panels';
import Heading from '@enact/moonstone/Heading';
import React, { Component } from 'react';
import TVHDataService, { TVHSettingsOptions } from '../services/TVHDataService';
import TVHSettingsTest from './TVHSettingsTest';
import TestResult from './TestResult';

export default class TVHSettings extends Component {
    static STORAGE_TVH_SETTING_KEY = 'TVH_SETTINGS';

    state: Readonly<TVHSettingsOptions>;

    constructor(public props: Readonly<any>) {
        super(props);

        this.state = {
            tvhUrl: '',
            user: '',
            password: '',
            dvrUuid: '',
            isValid: false,
            isLoading: false
        };
    }

    private handleSave = () => {
        if (!this.state.isValid) {
            return;
        }

        // put to storage
        localStorage.setItem(
            TVHSettings.STORAGE_TVH_SETTING_KEY,
            JSON.stringify({
                tvhUrl: this.state.tvhUrl,
                user: this.state.user,
                password: this.state.password,
                dvrUuid: this.state.testResults?.dvr.payload,
                isValid: this.state.isValid,
                testResults: this.state.testResults
            })
        );

        // call unmount
        this.props.handleUnmountSettings();
    };

    private handleUserChange = (object: any) => {
        // update state
        this.setState((state, props) => ({
            user: object.value,
            isValid: false
        }));

        // do not pass this event further
        return false;
    };

    private handlePasswordChange = (object: any) => {
        // update state
        this.setState((state, props) => ({
            password: object.value,
            isValid: false
        }));

        // do not pass this event further
        return false;
    };

    private handleUrlChange = (object: any) => {
        // update state
        this.setState((state, props) => ({
            connectionStatus: '',
            tvhUrl: object.value,
            isValid: false
        }));

        // do not pass this event further
        return false;
    };

    private handleConnectionTest = async (event?: any) => {
        event?.preventDefault();
        this.setState((state, props) => ({
            isLoading: true
        }));
        // do not test anything if url is not provided
        if (this.state.tvhUrl.length === 0) {
            this.setState((state, props) => ({
                isLoading: false
            }));
            return;
        }
        //test url verify if it works
        const service = new TVHDataService(this.state);
        const tester = new TVHSettingsTest(service);

        // retrieve server info
        const severalResults = await tester.testSeveral();
        this.setState((state, props) => ({
            testResults: {
                ...this.state.testResults,
                serverInfo: severalResults[0],
                playlist: severalResults[1],
                stream: severalResults[2]
            }
        }));
        const epgResult = await tester.testEpg();
        this.setState((state, props) => ({
            testResults: { ...this.state.testResults, epg: epgResult }
        }));
        const dvrResult = await tester.testDvr();
        this.setState((state, props) => ({
            testResults: { ...this.state.testResults, dvr: dvrResult }
        }));

        // update state
        this.setState((state, props) => ({
            connectButtonEnabled: true,
            isValid: this.isValidSetup(),
            isLoading: false
        }));
    };

    private isValidSetup(): boolean {
        return (
            (this.state.testResults?.serverInfo.accessible &&
                this.state.testResults.playlist.accessible &&
                this.state.testResults.stream.accessible) ||
            false
        );
    }

    componentDidMount() {
        // read state from storage if exists
        const settings = localStorage.getItem(TVHSettings.STORAGE_TVH_SETTING_KEY);
        if (settings) {
            this.setState((state, props) => JSON.parse(settings || ''));
        }
        // do connection test on mount
        this.handleConnectionTest();
    }

    render() {
        return (
            <div id="tvh-settings" ref="tvhsettings" tabIndex={-1} className="tvhSettings">
                <Panel>
                    <Header title="TVheadend Setup" type="compact" centered />
                    <Heading spacing="auto">TVheadend URL</Heading>
                    <Input
                        value={this.state.tvhUrl}
                        type="url"
                        onChange={this.handleUrlChange}
                        placeholder="http://192.168.0.10:9981/"
                    />
                    <Input
                        className="username"
                        value={this.state.user}
                        type="text"
                        onChange={this.handleUserChange}
                        placeholder="User (Optional)"
                    />
                    <Input
                        className="password"
                        value={this.state.password}
                        type="password"
                        onChange={this.handlePasswordChange}
                        placeholder="Password (Optional)"
                    />
                    <br /> <br />
                    {!this.state.isLoading && (
                        <Button backgroundOpacity="lightTranslucent" onClick={this.handleConnectionTest}>
                            Connect
                        </Button>
                    )}
                    {this.state.isLoading && <Spinner component={Panel} size="medium" />}
                    <Button
                        disabled={!this.state.isValid}
                        backgroundOpacity="lightTranslucent"
                        onClick={this.handleSave}
                    >
                        Save
                    </Button>
                    <br /> <br />
                    {this.state.testResults && <Heading spacing="auto">Connection Status</Heading>}
                    {this.state.testResults && <TestResult {...this.state.testResults} />}
                </Panel>
            </div>
        );
    }
}
