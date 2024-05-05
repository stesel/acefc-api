export interface LiveFC {
    id: string;
    title: string;
    time: string;
}

export type LiveFCs = Array<LiveFC>;

export interface LiveFCStream {
    id: string;
    quality: string;
    language: string;
}

export type LiveFCStreams = Array<LiveFCStream>;
