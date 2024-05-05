import { launch } from "puppeteer";
import { LiveFCs, LiveFCStreams } from "../types";

import { transliterate } from "transliteration";

export async function getLiveFC(): Promise<LiveFCs> {
    const browser = await launch({ headless: true });
    const page = await browser.newPage();
    await page.setViewport({
        width: 1280,
        height: 720,
    });

    console.log({ PROVIDER_URL: process.env.PROVIDER_URL });

    await page.goto(process.env.PROVIDER_URL);

    const mainBodies = await page.$$("div#main-body-bg.match--row.m-visible");

    const mainBody = mainBodies[0];

    const links = await mainBody.$$("a");

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
    const browser = await launch({ headless: true });
    const page = await browser.newPage();
    await page.setViewport({
        width: 1280,
        height: 720,
    });

    console.log({ PROVIDER_URL: process.env.PROVIDER_URL });

    await page.goto(process.env.PROVIDER_URL);

    const mainBodies = await page.$$("div#main-body-bg.match--row.m-visible");

    const mainBody = mainBodies[0];

    const links = await mainBody.$$("a");

    const index = Number(id);
    if (isNaN(index) || index >= links.length) {
        return [];
    }

    const link = links[index];

    const href = await page.evaluate(link => link.getAttribute("href"), link);

    await page.goto(href);

    const streamBlock = await page.$(".list-link-stream .stream-3row");

    if (!streamBlock) {
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
