import { CacheValue, LiveFCs, LiveFCStreams } from "../types";

import { transliterate } from "transliteration";
import { Browser, ElementHandle, launch, Page, Puppeteer } from "puppeteer";
import {
    getDbLiveFC,
    getDbLiveFCStreams,
    setDbLiveFC,
    setDbLiveFCStreams,
} from "../db";

const ONE_MINUTE = 60 * 1000;
const ONE_HOUR = 60 * ONE_MINUTE;

function isValidLiveFCCache(cacheValue: CacheValue<LiveFCs>): boolean {
    console.log(
        "validLiveFCCache:",
        new Date().toUTCString(),
        new Date(cacheValue.timestamp).toUTCString(),
    );
    return (
        Date.now() - cacheValue.timestamp < ONE_HOUR &&
        cacheValue.value.length > 0
    );
}

function isValidLiveFCStreamsCache<T>(cacheValue: CacheValue<T>): boolean {
    console.log(
        "validLiveFCStreamsCache:",
        new Date().toUTCString(),
        new Date(cacheValue.timestamp).toUTCString(),
    );
    return Date.now() - cacheValue.timestamp < ONE_MINUTE;
}

async function logHtmlContent(page: Page): Promise<void> {
    console.log(await page.content());
}

async function getProviderPage(): Promise<{ browser: Browser; page: Page }> {
    const browser = await launch({
        headless: true,
        args:
            process.env.NODE_ENV === "production"
                ? [
                      "--disable-setuid-sandbox",
                      "--no-sandbox",
                      "--single-process",
                      "--no-zygote",
                  ]
                : [],
        executablePath:
            process.env.NODE_ENV === "production"
                ? process.env.PUPPETEER_EXECUTABLE_PATH
                : undefined,
    });

    const page = await browser.newPage();

    await page.setViewport({
        width: 1280,
        height: 720,
    });

    await page.setUserAgent(
        // eslint-disable-next-line max-len
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
    );

    return { browser, page };
}

async function getMainBodyLinks(
    page: Page,
): Promise<ElementHandle<HTMLAnchorElement>[]> {
    const challengeBodyText = await page.$("#challenge-body-text");

    if (challengeBodyText) {
        console.log("Wait for challenge");
        await page.waitForSelector("div#main-body-bg.match--row.m-visible", {
            timeout: 60000,
        });
    }

    const mainBodies = await page.$$("div#main-body-bg.match--row.m-visible");

    const mainBody = mainBodies[0];

    if (!mainBody) {
        console.warn("no main body");

        await logHtmlContent(page);

        return [];
    }

    const links = await mainBody.$$("a");

    if (!links) {
        console.warn("no main body links");

        await logHtmlContent(page);

        return [];
    }

    return await mainBody.$$("a");
}

export async function getLiveFC(): Promise<LiveFCs> {
    console.log("getLiveFC");

    const cache = await getDbLiveFC();

    if (cache && isValidLiveFCCache(cache)) {
        console.log("return liveFC from cache");
        return cache.value;
    }

    const { browser, page } = await getProviderPage();

    await page.goto(process.env.PROVIDER_URL);

    const links = await getMainBodyLinks(page);

    const fcs: LiveFCs = [];

    const linkValues: Record<number, string> = {};

    for (const link of links) {
        const id = `${fcs.length}`;

        const title = await link.$$eval("td", tds => {
            let title = "";

            tds.forEach(td => {
                const computedStyle = window.getComputedStyle(td);
                if (
                    computedStyle.getPropertyValue("white-space") ===
                        "nowrap" &&
                    computedStyle.getPropertyValue("text-overflow") ===
                        "ellipsis"
                ) {
                    title = td.textContent;
                }
            });

            return title;
        });

        const time = await link.$eval(
            ".time-for-replace",
            element => element.textContent,
        );

        const linkValue = await link.evaluate(link =>
            link.getAttribute("href"),
        );

        linkValues[fcs.length] = linkValue;

        fcs.push({ id, title: transliterate(title), time });
    }

    await browser.close();

    await setDbLiveFC({
        value: fcs,
        links: linkValues,
        timestamp: Date.now(),
    });

    return fcs;
}

export async function getLiveFCSteams(id: string): Promise<LiveFCStreams> {
    console.log(`getLiveFCSteams:: ${id}`);

    const index = Number(id);

    if (isNaN(index)) {
        console.warn(`wrong live FC id: ${id}`);

        return [];
    }

    const streamsCache = await getDbLiveFCStreams(index);

    if (streamsCache && isValidLiveFCStreamsCache(streamsCache)) {
        console.log(`return liveFCStream/${index} from cache`);
        return streamsCache.value;
    }

    const { browser, page } = await getProviderPage();

    const cache = await getDbLiveFC();
    const hrefValue = !!cache ? cache.links[index] : undefined;

    if (hrefValue) {
        console.log("Get links from cache");
        await page.goto(hrefValue);
    } else {
        console.log("Get links from page");
        await page.goto(process.env.PROVIDER_URL);

        const links = await getMainBodyLinks(page);

        if (index >= links.length) {
            console.warn("no stream id");

            await logHtmlContent(page);

            return [];
        }

        const link = links[index];

        const href = await page.evaluate(
            link => link.getAttribute("href"),
            link,
        );

        await page.goto(href);
    }

    const streamBlock = await page.$(".list-link-stream .stream-3row");

    if (!streamBlock) {
        console.warn("no stream block");

        await logHtmlContent(page);

        return [];
    }

    const streamLinks = await streamBlock.$$("a");

    const streams: LiveFCStreams = [];

    for (const streamLink of streamLinks) {
        const { id, quality, language } = await streamLink.evaluate(a => ({
            id: a.getAttribute("href").split("://")[1],
            quality: (a.textContent.match(/\d+/) || ["default"])[0],
            language: (a
                .querySelector("img")
                .getAttribute("src")
                .match(/(\w+).\w+$/) || [])[1],
        }));

        streams.push({
            id,
            quality,
            language,
        });
    }

    await browser.close();

    await setDbLiveFCStreams(index, { value: streams, timestamp: Date.now() });

    return streams;
}
