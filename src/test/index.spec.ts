import request from "supertest";
import { app } from "../app";

describe("GET /", () => {
    it("should return 200 OK", () => {
        return request(app).get("/livefc").expect(200);
    });

    it("returns status", done => {
        return request(app)
            .get("/status")
            .end(function (err, res) {
                expect(res.text).toContain("Application is running");
                done();
            });
    });
});
