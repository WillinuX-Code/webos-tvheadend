import Icon from '@enact/moonstone/Icon';
import React from 'react';
import { ResultItem } from './TVHSettingsTest';

const warnStyle = {
    color: 'orange'
};
const TestResultItem = (result: ResultItem) => (
    <>
        <label>{result.label}</label>
        {result.accessible && (
            <>
                <Icon>check</Icon>
                {result.result}
            </>
        )}
        {!result.accessible && (
            <>
                <Icon>warning</Icon>
                <span style={warnStyle}>{result.result}</span>
            </>
        )}
    </>
);

export default TestResultItem;
