import assert from "node:assert/strict";
import { describe, it } from "node:test";
import jwt from "jsonwebtoken";
import request from "supertest";

import app from "../src/app.js";
import { JWT_KEY } from "../src/config/index.js";

let userNumber = 0;

describe("authentication endpoints", () => {
  it("registers a user without exposing their password", async () => {
    const credentials = createCredentials();
    const response = await register(credentials);

    assert.equal(response.body.email, credentials.email);
    assert.equal(response.body.password, undefined);
    assert.ok(response.body._id);
  });

  it("rejects invalid registration fields", async () => {
    const response = await request(app)
      .post("/users")
      .send({ email: "invalid", password: "short" })
      .expect(422);

    assert.ok(Array.isArray(response.body.errors));
    assert.equal(response.body.errors.length, 2);
  });

  it("logs in a registered user and returns a token", async () => {
    const credentials = createCredentials();
    await register(credentials);

    const response = await login(credentials);
    assert.equal(response.body.message, "Authentication successful");
    assert.equal(typeof response.body.token, "string");
    assert.equal(
      jwt.verify(response.body.token, JWT_KEY).email,
      credentials.email
    );
  });

  it("rejects invalid login credentials", async () => {
    const credentials = createCredentials();
    await register(credentials);

    await request(app)
      .post("/users/login")
      .send({ ...credentials, password: "incorrect-password" })
      .expect(401);
  });

  it("allows a valid token to access a protected endpoint", async () => {
    const credentials = createCredentials();
    await register(credentials);
    const { body } = await login(credentials);

    const response = await request(app)
      .get("/users/search")
      .set("Authorization", `Bearer ${body.token}`)
      .expect(200);

    assert.ok(Array.isArray(response.body.result));
  });

  it("rejects a missing authentication token", async () => {
    await request(app).get("/users/me").expect(401);
  });

  it("rejects an invalid authentication token", async () => {
    await request(app)
      .get("/users/me")
      .set("Authorization", "Bearer invalid-token")
      .expect(401);
  });

  it("rejects an expired authentication token", async () => {
    const token = jwt.sign({ sub: "expired-user" }, JWT_KEY, { expiresIn: -1 });

    await request(app)
      .get("/users/me")
      .set("Authorization", `Bearer ${token}`)
      .expect(401);
  });

  it("returns the current user for a valid token", async () => {
    const credentials = createCredentials();
    await register(credentials);
    const { body } = await login(credentials);

    const response = await request(app)
      .get("/users/me")
      .set("Authorization", `Bearer ${body.token}`)
      .expect(200);

    assert.equal(response.body.email, credentials.email);
    assert.equal(response.body.password, undefined);
  });
});

function createCredentials() {
  userNumber += 1;
  return {
    email: `generated-user-${userNumber}@example.com`,
    password: "correct-horse-battery-staple"
  };
}

function register(credentials) {
  return request(app)
    .post("/users")
    .send(credentials)
    .expect(201);
}

function login(credentials) {
  return request(app)
    .post("/users/login")
    .send(credentials)
    .expect(200);
}
