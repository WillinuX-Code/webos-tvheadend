import Button from '@enact/moonstone/Button';
import Spinner from '@enact/moonstone/Spinner';
import Input from '@enact/moonstone/Input';
import { Header, Panel } from "@enact/moonstone/Panels";
import Icon from '@enact/moonstone/Icon';
import Picker from '@enact/moonstone/Picker';
import Heading from '@enact/moonstone/Heading';
import React, { Component } from 'react';
import TVHDataService from '../services/TVHDataService';

export default class TVHSettings extends Component {

    static STORAGE_TVH_SETTING_KEY = 'TVH_SETTINGS';

    private testResult: string = '';

    state: Readonly<{
        tvhUrl: string;
        user?: string;
        password?: string;
        selectedProfile: string;
        profiles: Array<any>;
        tvChannelTagUuid?: string;
        dvrConfigUuid?: string;
        connectButtonEnabled?: boolean;
        isValid?: boolean;
        isUserValid?: boolean;
        isLoading?: boolean;
    }>;

    constructor(public props: Readonly<any>) {
        super(props);

        this.state = {
            tvhUrl: 'http://',
            user: '',
            password: '',
            selectedProfile: '',
            profiles: [],
            tvChannelTagUuid: '',
            dvrConfigUuid: '',
            connectButtonEnabled: false,
            isValid: false,
            isLoading: false
            // TODO user password
        }
    }

    handleSave() {
        if (!this.state.isValid) {
            return
        }
        // put to storage
        localStorage.setItem(TVHSettings.STORAGE_TVH_SETTING_KEY, JSON.stringify({
            tvhUrl: this.state.tvhUrl,
            user: this.state.user,
            password: this.state.password,
            selectedProfile: this.state.selectedProfile,
            profiles: this.state.profiles,
            //tvChannelTagUuid: this.state.tvChannelTagUuid,
            dvrConfigUuid: this.state.dvrConfigUuid,
            isValid: this.state.isValid
        }));
        // call unmount
        this.props.handleUnmountSettings();
    }

    handleUserChange(object: any) {
         // update state
         this.setState((state, props) => ({
            profiles: [],
            selectedProfile: '',
            user: object.value,
            isValid: false,
            connectButtonEnabled: object.value.length > 0
        }));

        // do not pass this event further
        return false;
    }

    handlePasswordChange(object: any) {
        // update state
        this.setState((state, props) => ({
            profiles: [],
            selectedProfile: '',
            password: object.value,
            isValid: false,
            connectButtonEnabled: object.value.length > 0
        }));

        // do not pass this event further
        return false;
    }

    handleProfileChange(object: any) {
        // update state
        this.setState((state, props) => ({
            selectedProfile: object.value
        }));

        // do not pass this event further
        return false;
    }

    handleUrlChange(object: any) {
        // if url changes we reset test result
        this.testResult = '';

        // update state
        this.setState((state, props) => ({
            profiles: [],
            selectedProfile: '',
            tvhUrl: object.value,
            isValid: false,
            connectButtonEnabled: object.value.length > 0
        }));

        // do not pass this event further
        return false;
    }

    async handleConnectionTest(event: any) {
        event.preventDefault();
        this.setState((state, props) => ({
            isLoading: true
        }));
        //test url verify if it works
        let service = new TVHDataService(this.state);
        try {
            // retrieve server info
            let serverInfoResult = await service.retrieveServerInfo();
            this.testResult = 'Version: ' + serverInfoResult.result.sw_version + ' - API Version: ' + serverInfoResult.result.api_version;

            let profilesResult = await service.retrieveProfileList();
            let profiles: string[] = [];
            profilesResult.result.entries.forEach((entry: any) => {
                profiles.push(entry.val);
            });
            // move "pass" profile to beginning of array
            if (profiles.indexOf('pass') > 0) {
                profiles.splice(profiles.indexOf('pass'), 1);
                profiles.unshift('pass');
            }
            // retrieve channel tags
            //let tvChannelTagUuid = await service.retrieveTvChannelTag();
            // retrieve the default dvr config
            let dvrConfigUuid = await service.retrieveDVRConfig();
            // state update
            this.setState((state, props) => ({
                //tvChannelTagUuid: tvChannelTagUuid,
                dvrConfigUuid: dvrConfigUuid,
                profiles: profiles,
                selectedProfile: profiles[0],
                connectButtonEnabled: false,
                isValid: true,
                isLoading: false
            }));
        } catch (error) {
            this.testResult = 'Failed to connect: ' + (error.errorText ? error.errorText : error);
            this.setState((state, props) => ({
                isLoading: false,
                isValid: false
            }));
        }
    }

    componentDidMount() {
        this.handleSave = this.handleSave.bind(this);
        this.handleUserChange = this.handleUserChange.bind(this);
        this.handlePasswordChange = this.handlePasswordChange.bind(this);
        this.handleProfileChange = this.handleProfileChange.bind(this);
        this.handleUrlChange = this.handleUrlChange.bind(this);
        this.handleConnectionTest = this.handleConnectionTest.bind(this);
        // read state from storage if exists
        let settings = localStorage.getItem(TVHSettings.STORAGE_TVH_SETTING_KEY);
        if (settings) {
            this.setState((state, props) => JSON.parse(settings || ''));
        }
    }

    componentDidUpdate(prevProps: any) {

    }

    componentWillUnmount() {

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
                        placeholder="http://192.168.0.10:9981/" />
                
                    <Input
                        value={this.state.user}
                        type="text"
                        onChange={this.handleUserChange}
                        invalidMessage=""
                        invalid={!this.state.isUserValid}
                        placeholder="User (Optional)" />
                   
                    <Input
                        value={this.state.password}
                        type="text"
                        onChange={this.handlePasswordChange}
                        invalidMessage=""
                        invalid={!this.state.isUserValid}
                        placeholder="Password (Optional)" />
                    <br /> <br />
                    {!this.state.isLoading && <Button disabled={!this.state.connectButtonEnabled} backgroundOpacity="lightTranslucent" onClick={this.handleConnectionTest}>Connect</Button>}
                    {this.state.isLoading && <Spinner component={Panel} size="medium" />}
                    <br /> <br />
                    <Heading spacing="auto">Connection Status</Heading>
                    {this.testResult.length === 0 && <Icon>question</Icon>}
                    {this.testResult.length > 0 &&
                        <>
                            {this.state.isValid && <Icon>check</Icon>}
                            {!this.state.isValid && <Icon>warning</Icon>}
                            {this.testResult}
                        </>
                    }

                    {this.state.profiles.length > 0 &&
                        <>
                            <br /> <br />
                            <Heading spacing="auto">Stream profile</Heading>
                            <Picker defaultValue={this.state.profiles.indexOf(this.state.selectedProfile)} onChange={this.handleProfileChange} width="medium">
                                {this.state.profiles}
                            </Picker>
                        </>
                    }
                    
                    <br /> <br />
                    <Button disabled={!this.state.isValid} backgroundOpacity="lightTranslucent" onClick={this.handleSave}>Save</Button>
                    
                </Panel>
            </div>
        );
    }
}