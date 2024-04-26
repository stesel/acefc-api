import { Request, Response } from "express";

/**
 * GET /
 * Status page.
 */
export const status = async (req: Request, res: Response): Promise<void> => {
    res.render("status", { status: "running" });
};

/**
 * GET /
 * Live FC.
 */
export const livefc = async (req: Request, res: Response): Promise<void> => {
    res.json({
        name: "Manchester United vs. Barcelona",
        streams: [
            {
                url: "http://example.com/livefc",
                quality: "7000kb",
                language: "en",
            },
        ],
    });
};
