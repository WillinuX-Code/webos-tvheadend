import 'core-js/stable';
import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import kind from '@enact/core/kind';
import MoonstoneDecorator from '@enact/moonstone/MoonstoneDecorator';
import { AppContextProvider } from './AppContext';

const AppBase = kind({
    name: 'App',
    render: () => (
        <AppContextProvider>
            <App />
        </AppContextProvider>
    )
});

const DecoratedApp = MoonstoneDecorator(AppBase);

ReactDOM.render(
    <React.StrictMode>
        <DecoratedApp />
    </React.StrictMode>,
    document.getElementById('root')
);
