import { JsonDB, Config } from "node-json-db";
import { CacheValue, LiveFCCache, LiveFCStreams } from "../types";

const db = new JsonDB(new Config("acefc-db", true, true, "/"));

export async function getDbLiveFC(): Promise<
    LiveFCCache["liveFC"] | undefined
> {
    try {
        const value = await db.getObject<LiveFCCache["liveFC"]>("/liveFC");
        return value;
    } catch (error) {
        return undefined;
    }
}

export async function setDbLiveFC(value: LiveFCCache["liveFC"]) {
    await db.push("/liveFC", value, true);
}

export async function getDbLiveFCStreams(
    index: number,
): Promise<CacheValue<LiveFCStreams> | undefined> {
    try {
        const value = await db.getObject<CacheValue<LiveFCStreams>>(
            `/liveFCStreams/${index}`,
        );
        return value;
    } catch (error) {
        return undefined;
    }
}

export async function setDbLiveFCStreams(
    index: number,
    value: CacheValue<LiveFCStreams>,
) {
    await db.push(`/liveFCStreams/${index}`, value, true);
}
