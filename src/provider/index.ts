import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

import { CacheValue, LiveFCCache, LiveFCs, LiveFCStreams } from "../types";

import { transliterate } from "transliteration";
import { Browser, ElementHandle, Page } from "puppeteer";

const ONE_HOUR = 3600000;

const cache: LiveFCCache = {
    liveFC: { value: [], links: new Map(), timestamp: 0 },
    liveFCStreams: new Map(),
};

function isValidLiveFCCache(cacheValue: CacheValue<LiveFCs>): boolean {
    return new Date().getUTCDate() !== new Date(cacheValue.timestamp).getUTCDate() && cacheValue.value.length > 0;
}

function isValidCache<T>(cacheValue: CacheValue<T>): boolean {
    return Date.now() - cacheValue.timestamp < 60000;
}

async function logHtmlContent(page: Page): Promise<void> {
    console.log(await page.content());
}

async function getProviderPage(): Promise<{ browser: Browser; page: Page }> {
    const browser = await puppeteer.use(StealthPlugin()).launch({
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
    await page.waitForSelector(".head_bestmacth");

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

    if (isValidLiveFCCache(cache.liveFC)) {
        console.log("return liveFC from cache");
        return cache.liveFC.value;
    }

    const { browser, page } = await getProviderPage();

    await page.goto(process.env.PROVIDER_URL);

    const links = await getMainBodyLinks(page);

    const fcs: LiveFCs = [];

    const linkValues = new Map();

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

        fcs.push({ id, title: transliterate(title), time });
        
        const linkValue = await link.evaluate(link => link.getAttribute("href"));

        linkValues.set(id, linkValue);
    }

    await browser.close();

    cache.liveFC = {
        value: fcs,
        links: linkValues,
        timestamp: Date.now(),
    };

    return fcs;
}

export async function getLiveFCSteams(id: string): Promise<LiveFCStreams> {
    console.log(`getLiveFCSteams:: ${id}`);

    const index = Number(id);

    if (isNaN(index)) {
        console.warn(`wrong live FC id: ${id}`);

        return [];
    }

    const streamsCache = cache.liveFCStreams.get(index);

    if (streamsCache && isValidCache(streamsCache)) {
        return streamsCache.value;
    }

    const { browser, page } = await getProviderPage();

    const hrefValue = cache.liveFC.links.get(index);

    if (hrefValue) {
        await page.goto(hrefValue);
    } else {
        await page.goto(process.env.PROVIDER_URL);

        const links = await getMainBodyLinks(page);
    
        if (index >= links.length) {
            console.warn("no stream id");
    
            await logHtmlContent(page);
    
            return [];
        }

        const link = links[index];

        const href = await page.evaluate(link => link.getAttribute("href"), link);

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

    cache.liveFCStreams.set(index, { value: streams, timestamp: Date.now() });

    return streams;
}

function checkLiveFCCache() {
    if (!isValidLiveFCCache(cache.liveFC)) {
        getLiveFC().then(() => console.log("LiveFC cache updated"));
    }
    setTimeout(checkLiveFCCache, ONE_HOUR);
}

checkLiveFCCache();
