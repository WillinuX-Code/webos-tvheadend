import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import AppContent from './App';
import kind from "@enact/core/kind";
import MoonstoneDecorator from "@enact/moonstone/MoonstoneDecorator";

// import {Client as Styletron} from 'styletron-engine-atomic';
// import {Provider as StyletronProvider} from 'styletron-react';
// import {LightTheme, BaseProvider, styled} from 'baseui';
//import reportWebVitals from './reportWebVitals';

// const engine = new Styletron();
// const Centered = styled('div', {
//   display: 'flex',
//   justifyContent: 'center',
//   alignItems: 'center',
//   height: '100%',
// });

const AppBase = kind({
  name: "App",
  /*styles: {
    className: "app",
    css: "./App.css"
  },*/
  render: props => {
    return (
      <AppContent />
    );
  }
});

const App = MoonstoneDecorator(AppBase);

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
//reportWebVitals(console.log);
