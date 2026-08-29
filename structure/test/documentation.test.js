import assert from "node:assert/strict";
import { describe, it } from "node:test";
import request from "supertest";

import app from "../src/app.js";

describe("API documentation", () => {
  it("redirects the application root to the documentation site", async () => {
    const response = await request(app).get("/").expect(302);
    assert.equal(response.headers.location, "/docs");
  });

  it("serves the documentation website", async () => {
    const response = await request(app).get("/docs/").expect(200);
    assert.match(response.headers["content-type"], /text\/html/);
    assert.match(response.text, /API documentation/);
  });

  it("serves the generated OpenAPI document", async () => {
    const response = await request(app).get("/docs/openapi.json").expect(200);
    assert.equal(response.body.openapi, "3.1.0");
    assert.ok(response.body.paths["/health"]);
  });
});
