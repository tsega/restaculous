import assert from "node:assert/strict";
import { describe, it } from "node:test";
import request from "supertest";

import app from "../src/app.js";

describe("health endpoint", () => {
  it("reports that the application process is running", async () => {
    const response = await request(app).get("/health").expect(200);

    assert.deepEqual(response.body, { status: "ok" });
  });
});
