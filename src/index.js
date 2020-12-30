import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import {Client as Styletron} from 'styletron-engine-atomic';
import {Provider as StyletronProvider} from 'styletron-react';
import {LightTheme, BaseProvider, styled} from 'baseui';
//import reportWebVitals from './reportWebVitals';

const engine = new Styletron();
const Centered = styled('div', {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  height: '100%',
});

ReactDOM.render(
  <React.StrictMode>
      <StyletronProvider value={engine}>
      <BaseProvider theme={LightTheme}>
        <Centered>
          <App />
        </Centered>
      </BaseProvider>
    </StyletronProvider> 
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
//reportWebVitals(console.log);
