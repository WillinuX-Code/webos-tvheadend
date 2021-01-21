import Button from '@enact/moonstone/Button';
import Spinner from '@enact/moonstone/Spinner';
import Input from '@enact/moonstone/Input';
import { Header, Panel } from '@enact/moonstone/Panels';
import Icon from '@enact/moonstone/Icon';
import Heading from '@enact/moonstone/Heading';
import React, { Component } from 'react';
import TVHDataService, { TVHSettingsOptions } from '../services/TVHDataService';

export default class TVHSettings extends Component {
    static STORAGE_TVH_SETTING_KEY = 'TVH_SETTINGS';

    state: Readonly<TVHSettingsOptions>;

    constructor(public props: Readonly<any>) {
        super(props);

        this.state = {
            tvhUrl: 'http://',
            user: '',
            password: '',
            connectionStatus: '',
            // selectedProfile: '',
            // profiles: [],
            // tvChannelTagUuid: '',
            dvrConfigUuid: '',
            connectButtonEnabled: false,
            isValid: false,
            isUserValid: false,
            isLoading: false,
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
                // selectedProfile: this.state.selectedProfile,
                // profiles: this.state.profiles,
                //tvChannelTagUuid: this.state.tvChannelTagUuid,
                dvrConfigUuid: this.state.dvrConfigUuid,
                isValid: this.state.isValid,
            })
        );

        // call unmount
        this.props.handleUnmountSettings();
    };

    private handleUserChange = (object: any) => {
        // update state
        this.setState((state, props) => ({
            // profiles: [],
            // selectedProfile: '',
            user: object.value,
            isValid: false,
            connectButtonEnabled: object.value.length > 0,
        }));

        // do not pass this event further
        return false;
    };

    private handlePasswordChange = (object: any) => {
        // update state
        this.setState((state, props) => ({
            // profiles: [],
            // selectedProfile: '',
            password: object.value,
            isValid: false,
            connectButtonEnabled: object.value.length > 0,
        }));

        // do not pass this event further
        return false;
    };

    private handleProfileChange = (object: any) => {
        // update state
        this.setState((state, props) => ({
            selectedProfile: object.value,
        }));

        // do not pass this event further
        return false;
    };

    private handleUrlChange = (object: any) => {
        // update state
        this.setState((state, props) => ({
            // profiles: [],
            // selectedProfile: '',
            connectionStatus: '',
            tvhUrl: object.value,
            isValid: false,
            connectButtonEnabled: object.value.length > 0,
        }));

        // do not pass this event further
        return false;
    };

    private handleConnectionTest = async (event: any) => {
        event.preventDefault();
        this.setState((state, props) => ({
            isLoading: true,
        }));

        //test url verify if it works
        const service = new TVHDataService(this.state);

        try {
            // retrieve server info
            //let serverInfoResult = await service.retrieveServerInfo();
            //this.testResult = 'Version: ' + serverInfoResult.result.sw_version + ' - API Version: ' + serverInfoResult.result.api_version;
            this.getConnectionInfo(service);

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
            const dvrConfigUuid = await service.retrieveDVRConfig();
            // state update
            this.setState((state, props) => ({
                //tvChannelTagUuid: tvChannelTagUuid,
                dvrConfigUuid: dvrConfigUuid,
                // profiles: profiles,
                // selectedProfile: profiles[0],
                connectButtonEnabled: false,
                isValid: true,
                isLoading: false,
            }));
        } catch (error) {
            // this.testResult = 'Failed to connect: ' + (error.errorText ? error.errorText : error);
            this.setState((state, props) => ({
                isLoading: false,
                isValid: false,
            }));
        }
    };

    private async getConnectionInfo(service: TVHDataService) {
        try {
            const serverInfoResult = await service.retrieveServerInfo();
            this.setState((state, props) => ({
                connectionStatus:
                    'Version: ' + serverInfoResult.sw_version + ' - API Version: ' + serverInfoResult.api_version,
                isLoading: false,
                isValid: true,
            }));
        } catch (error) {
            this.setState((state, props) => ({
                connectionStatus: 'Failed to connect: ' + (error.errorText ? error.errorText : error),
                isLoading: false,
                isValid: false,
            }));
        }
    }

    componentDidMount() {
        // read state from storage if exists
        const settings = localStorage.getItem(TVHSettings.STORAGE_TVH_SETTING_KEY);
        if (settings) {
            this.setState((state, props) => JSON.parse(settings || ''));
        }

        // get current connection info, if possible
        this.getConnectionInfo(this.props.tvhService);
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
                        type="text"
                        onChange={this.handlePasswordChange}
                        placeholder="Password (Optional)"
                    />
                    <br /> <br />
                    {!this.state.isLoading && (
                        <Button
                            disabled={!this.state.connectButtonEnabled}
                            backgroundOpacity="lightTranslucent"
                            onClick={this.handleConnectionTest}
                        >
                            Connect
                        </Button>
                    )}
                    {this.state.isLoading && <Spinner component={Panel} size="medium" />}
                    <br /> <br />
                    <Heading spacing="auto">Connection Status</Heading>
                    {this.state.connectionStatus.length === 0 && <Icon>question</Icon>}
                    {this.state.connectionStatus.length > 0 && (
                        <>
                            {this.state.isValid && <Icon>check</Icon>}
                            {!this.state.isValid && <Icon>warning</Icon>}
                            {this.state.connectionStatus}
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
                    <Button
                        disabled={!this.state.isValid}
                        backgroundOpacity="lightTranslucent"
                        onClick={this.handleSave}
                    >
                        Save
                    </Button>
                </Panel>
            </div>
        );
    }
}
