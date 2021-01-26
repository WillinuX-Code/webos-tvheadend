import React from 'react';
import ReactDOM from 'react-dom';
import AppContent from './App';
import kind from '@enact/core/kind';
import MoonstoneDecorator from '@enact/moonstone/MoonstoneDecorator';

const AppBase = kind({
    name: 'App',
    render: () => <AppContent />
});

const App = MoonstoneDecorator(AppBase);

ReactDOM.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
    document.getElementById('root')
);
