import React from 'react';
import Dialog from '@enact/moonstone/Dialog';
import BodyText from '@enact/moonstone/BodyText';
import Button from '@enact/moonstone/Button';
import { forProp, handle, oneOf } from '@enact/core/handle';
import kind from '@enact/core/kind';

interface ButtonProps {
    source: 'confirm' | 'abort';
    children: React.ReactNode;
}

const DialogPopup = (props: {
    title: string;
    subtitle: string;
    confirmText: string;
    abortText: string;
    confirmAction: () => void;
    abortAcion: () => void;
}) => {
    const dialogHandler = handle(
        // suppress React event warnings in CodeSandbox console
        oneOf([forProp('source', 'confirm'), props.confirmAction], [forProp('source', 'abort'), props.abortAcion])
    );

    const DialogButton = kind<ButtonProps>({
        name: 'DialogButton',
        handlers: {
            onClick: dialogHandler
        },
        render: (props) => <Button {...props} />
    });

    return (
        <Dialog
            open={true}
            title={props.title}
            buttons={
                <>
                    <DialogButton source="confirm">{props.confirmText}</DialogButton>
                    <DialogButton source="abort">{props.abortText}</DialogButton>
                </>
            }
        >
            <BodyText>{props.subtitle}</BodyText>
        </Dialog>
    );
};

export default DialogPopup;
