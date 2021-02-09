import { get as getDBValue, set as setDBValue } from 'idb-keyval';
import { compress, decompress } from 'lzutf8';
import EPGChannel from '../models/EPGChannel';
import EPGEvent from '../models/EPGEvent';
import EPGUtils from './EPGUtils';

interface ChannelEvents {
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

const DB_KEY = 'EPGCache';

const getEpgCache = async () => {
    const epgData = await getDBValue<string>(DB_KEY);
    let epgCache: ChannelEvents = {};
    if (epgData) {
        const decompressedData = decompress(epgData, { inputEncoding: 'Base64' });
        epgCache = JSON.parse(decompressedData);
    }
    return epgCache;
};

const setEpgCache = (epgCache: ChannelEvents) => {
    const compressedData = compress(JSON.stringify(epgCache), { outputEncoding: 'Base64' });
    return setDBValue(DB_KEY, compressedData);
};

const combineEvents = (previousEvents: ChannelEvents, currentEvents: ChannelEvents): ChannelEvents => {
    const events: ChannelEvents = {};
    const TWO_DAYS = 2 * 24 * 60 * 60 * 1000;

    // loop through all current channel keys and update the epg data for each
    Object.entries(currentEvents).forEach(([key, value]) => {
        const combinedEvents = [...(previousEvents[key] || []), ...value];
        // filter the combined list of events to have only unique data that is not older than two days
        events[key] = combinedEvents.filter((epgEvent, index, self) => {
            return (
                epgEvent['end'] > EPGUtils.getNow() - TWO_DAYS &&
                self.findIndex((uniqueEvent) => uniqueEvent['id'] === epgEvent['id']) === index
            );
        });
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

const showIndexedDBUsage = () => {
    navigator.storage.estimate().then((storageEstimate) => {
        if (storageEstimate.usage && storageEstimate.quota) {
            const usageInPercent = storageEstimate.usage / storageEstimate.quota;
            console.log(usageInPercent.toFixed(2) + '% of indexedDB space used.');
        }
    });
};

export const restoreEpgDataFromCache = (channels: EPGChannel[]) => {
    // get current events
    const currentChannelEvents = getChannelEvents(channels);

    // get epg data from cache
    getEpgCache()
        .then((previousChannelEvents) => {
            // update epg data
            const combinedChannelEvents = combineEvents(previousChannelEvents, currentChannelEvents);
            setChannelEvents(channels, combinedChannelEvents);
            console.log('EPG data restored');

            // storing new epg data to cache
            setEpgCache(combinedChannelEvents)
                .then(() => console.log('updated EPG data cache'))
                .finally(() => showIndexedDBUsage());
        })
        .catch((error) => {
            console.error('failed to get EPG data from cache!', error);
        });
};
