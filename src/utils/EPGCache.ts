import EPGChannel from '../models/EPGChannel';
import EPGEvent from '../models/EPGEvent';
import EPGUtils from './EPGUtils';

export interface ChannelEvents {
    [key: string]: EPGEventObject[];
}

interface EPGEventObject {
    id: number;
    start: number;
    end: number;
    title: string;
    description: string;
    subTitle: string;
    channelUuid: string;
}

const combineEvents = (previousEvents: ChannelEvents, currentEvents: ChannelEvents): ChannelEvents => {
    const events: ChannelEvents = {};
    const TWO_DAYS = 2 * 24 * 60 * 60 * 1000;

    // trim previous channel events to current time position
    const currentTime = EPGUtils.getNow();
    Object.entries(previousEvents).forEach(([key, value]) => {
        previousEvents[key] = value.filter((epgEvent) => epgEvent.end < currentTime);
    });

    // loop through all current channel keys and update the epg data for each
    const pastTime = EPGUtils.getNow() - TWO_DAYS;
    Object.entries(currentEvents).forEach(([key, value]) => {
        const combinedEvents = [...(previousEvents[key] || []), ...value];
        // filter the combined list of events to have only unique data that is not older than two days
        events[key] = combinedEvents.filter((epgEvent) => epgEvent.end > pastTime);
    });

    return events;
};

const getChannelEvents = (channels: EPGChannel[]) => {
    const currentChannelEvents = {} as ChannelEvents;

    channels.forEach((channel) => {
        const channelId = channel.getUUID();
        currentChannelEvents[channelId] = channel.getEvents().map((event) => {
            const eventObject: EPGEventObject = {
                id: event.getId(),
                start: event.getStart(),
                end: event.getEnd(),
                title: event.getTitle(),
                description: event.getDescription(),
                subTitle: event.getSubTitle(),
                channelUuid: event.getChannelUuid()
            };
            return eventObject;
        });
    });

    return currentChannelEvents;
};

const setChannelEvents = (channels: EPGChannel[], channelEvents: ChannelEvents) => {
    channels.forEach((channel) => {
        const epgEvents = channelEvents[channel.getUUID()];
        channel.setEvents(
            epgEvents.map((epgEventObject) => {
                const { id, start, end, title, description, subTitle, channelUuid } = epgEventObject;
                return new EPGEvent(id, start, end, title, description, subTitle, channelUuid);
            })
        );
    });
};

export const restoreEpgDataFromCache = (previousChannelEvents: ChannelEvents, channels: EPGChannel[]) => {
    // get current events
    const currentChannelEvents = getChannelEvents(channels);
    // update epg data
    const combinedChannelEvents = combineEvents(previousChannelEvents, currentChannelEvents);
    setChannelEvents(channels, combinedChannelEvents);
    // return channels
    return { channels: channels, channelEvents: combinedChannelEvents };
};
