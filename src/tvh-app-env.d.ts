interface AudioTrack {
    enabled: boolean;
    readonly id: string;
    kind: string;
    readonly label: string;
    language: string;
    readonly sourceBuffer: SourceBuffer;
}

interface AudioTrackList {
    readonly length: number;
    [index: number]: AudioTrack;
}

interface HTMLVideoElement extends globalThis.HTMLVideoElement {
    readonly audioTracks: AudioTrackList;
}
