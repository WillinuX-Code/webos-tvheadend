interface ParserResult {
    epgUrl?: string;
    items: Item[];
}

interface Item {
    channelId: string;
    channelNumber: string;
    channelName: string;
    logoUrl: string;
    streamUrl: string;
}

export default class M3UParser {
    static parse(m3uContent: string): ParserResult {
        const result = {
            items: []
        } as ParserResult;

        const manifest = m3uContent.split(/(?=#EXTINF)/).map((l) => l.trim());
        const firstLine = manifest.shift();
        if (!firstLine || !/#EXTM3U/.test(firstLine)) {
            throw new Error('Playlist is not valid');
        }
        result.epgUrl = this.getAttribute(firstLine, 'x-tvg-url');
        for (const entry of manifest) {
            const item = {
                channelName: this.getAttribute(entry, 'tvg-name') || this.getName(entry),
                channelId: this.getAttribute(entry, 'tvg-id'),
                channelNumber: this.getAttribute(entry, 'tvg-chno'),
                logoUrl: this.getAttribute(entry, 'tvg-logo') || this.getAttribute(entry, 'logo'),
                streamUrl: this.getAttribute(entry, 'tvg-url') || this.getURL(entry)
            } as Item;
            result.items.push(item);
        }

        return result;
    }

    private static getAttribute(entry: string, name: string) {
        const regex = new RegExp(name + '="(.*?)"', 'gi');
        const match = regex.exec(entry);

        return match && match[1] ? match[1] : '';
    }

    private static getURL(entry: string): string {
        const supportedTags = ['#EXTVLCOPT', '#EXTINF', '#EXTGRP'];
        const last = entry
            .split('\n')
            .filter((l) => l)
            .map((l) => l.trim())
            .filter((l) => {
                return supportedTags.every((t) => !l.startsWith(t));
            })
            .shift();

        return last || '';
    }

    /**
     * expected entry content (2 lines)
     *
     * #EXTINF:-1 logo="http://192.168.0.10:9981/imagecache/7167?auth=Ps4Lz4D7VbgU-fyB0F6m0T6YIvlw" tvg-id="978ffcc9bede159db867631b28b2ce0a" tvg-chno="1",Das Erste HD
     * http://192.168.0.10:9981/stream/channelid/1241288599?auth=Ps4Lz4D7VbgU-fyB0F6m0T6YIvlw&profile=pass
     */
    private static getName(entry: string): string {
        const lines = entry.split(/(\r?\n)+/);
        const firstLine = lines.shift() || ',';
        const nameSplit = firstLine.split(',');
        const name = nameSplit.pop();
        return name || '';
    }
}
