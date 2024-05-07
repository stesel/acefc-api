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

export interface CacheValue<T> {
    value: T;
    timestamp: number;
}
export interface LiveFCCache {
    liveFC: CacheValue<LiveFCs>;
    liveFCStreams: Map<number, CacheValue<LiveFCStreams>>;
}
