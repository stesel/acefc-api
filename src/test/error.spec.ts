import request from "supertest";
import { app } from "../app";

describe("Error page", () => {
    it("returns 404 for not existing page", () => {
        return request(app).get("/").expect(404);
    });
});
