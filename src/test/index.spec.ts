import request from "supertest";
import { app } from "../app";

describe("GET /", () => {
    it("should return 200 OK", async () => {
        const res = await request(app).get("/livefc");
        expect(res.status).toBe(200);
    });

    it("returns status", async () => {
        const res = await request(app).get("/status");
        expect(res.text).toContain("Application is running");
    });
});
