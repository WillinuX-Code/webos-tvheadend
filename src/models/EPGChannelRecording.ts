import EPGChannel from './EPGChannel';

export type EPGChannelRecordingKind = 'REC_FINISHED' | 'REC_FAILED' | 'REC_UPCOMING';

/**
 * Created by satadru on 3/30/17.
 */
export default class EPGChannelRecording extends EPGChannel {
    constructor(
        protected icon: URL | undefined,
        protected name: string,
        protected id: number,
        protected uuid: string,
        protected streamUrl: URL,
        private kind: EPGChannelRecordingKind
    ) {
        super(icon, name, id, uuid, streamUrl);
    }

    getKind() {
        return this.kind;
    }
}
