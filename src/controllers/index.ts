import { Request, Response } from "express";
import { getLiveFC, getLiveFCSteams } from "../provider";
import { LiveFCStreams, LiveFCs } from "../types";

/**
 * GET /
 * Status page.
 */
export const status = async (req: Request, res: Response): Promise<void> => {
    console.log(process.env.NODE_ENV);
    res.render("status", { status: "running" });
};

/**
 * GET /
 * Live FC.
 */
export const livefc = async (
    req: Request,
    res: Response<LiveFCs>,
): Promise<void> => {
    try {
        res.json(await getLiveFC());
    } catch (error) {
        console.log(error);
        res.json([]);
    }
};

/**
 * GET /
 * Live FC Streams.
 */
export const livefcstreams = async (
    req: Request<{ id: string }>,
    res: Response<LiveFCStreams>,
): Promise<void> => {
    try {
        res.json(await getLiveFCSteams(req.params.id));
    } catch (error) {
        console.log(error);
        res.json([]);
    }
};
