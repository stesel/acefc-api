import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

import { LiveFCs, LiveFCStreams } from "../types";

import { transliterate } from "transliteration";
import { Browser, ElementHandle, Page } from "puppeteer";

puppeteer.use(StealthPlugin());

async function logHtmlContent(page: Page): Promise<void> {
    console.log(await page.content());
}

async function getProviderPage(): Promise<{ browser: Browser; page: Page }> {
    console.log({
        NODE_ENV: process.env.NODE_ENV,
        PUPPETEER_EXECUTABLE_PATH: process.env.PUPPETEER_EXECUTABLE_PATH,
        PROVIDER_URL: process.env.PROVIDER_URL,
    });

    const browser = await puppeteer.launch({
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

    await page.goto(process.env.PROVIDER_URL);

    return { browser, page };
}

async function getMainBodyLinks(
    page: Page,
): Promise<ElementHandle<HTMLAnchorElement>[]> {
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
    console.log(`getLiveFC`);

    const { browser, page } = await getProviderPage();

    const links = await getMainBodyLinks(page);

    const fcs: LiveFCs = [];

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
    }

    await browser.close();

    return fcs;
}

export async function getLiveFCSteams(id: string): Promise<LiveFCStreams> {
    console.log(`getLiveFCSteams:: ${id}`);

    const { browser, page } = await getProviderPage();

    const links = await getMainBodyLinks(page);

    const index = Number(id);
    if (isNaN(index) || index >= links.length) {
        console.warn("no stream id");

        await logHtmlContent(page);

        return [];
    }

    const link = links[index];

    const href = await page.evaluate(link => link.getAttribute("href"), link);

    await page.goto(href);

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

    return streams;
}
