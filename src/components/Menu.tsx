import BodyText from '@enact/moonstone/BodyText';
import LabeledIconButton from '@enact/moonstone/LabeledIconButton';
import React from 'react';

export interface MenuItem {
    icon: string;
    label: string;
    action: () => void;
}

const Menu = (props: { items: MenuItem[]; unmount: () => void }) => {
    /**
     * render menu items
     *
     * @param items
     */
    const renderItems = (items: MenuItem[]) => {
        const result = [];
        for (let i = 0; i < items.length; i++) {
            result.push(
                <div className="menuItem" key={i}>
                    <LabeledIconButton
                        size="large"
                        icon={items[i].icon}
                        labelPosition="left"
                        onClick={() => items[i].action()}
                        onKeyDown={(event: React.KeyboardEvent<HTMLDivElement>) => {
                            // enter / ok
                            event.keyCode === 13 && items[i].action();
                        }}
                    >
                        <label>{items[i].label}</label>
                    </LabeledIconButton>
                </div>
            );
        }

        return result;
    };

    return <div className="menu">{renderItems(props.items)}</div>;
};

export default Menu;
