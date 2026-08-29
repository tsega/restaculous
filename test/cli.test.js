import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { generate as generateRoutes } from "../generators/route.js";
import {
  loadSettings,
  SettingsError,
  validateSettings
} from "../cli/settings.js";
import { runWorkflow } from "../cli/workflow.js";

const projectDirectory = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);

test("CLI prints guidance when no settings file is provided", () => {
  const output = execFileSync(process.execPath, ["app.js"], {
    cwd: projectDirectory,
    encoding: "utf8"
  });

  assert.match(output, /settings\.json file not provided/i);
});

test("CLI reports a missing settings file and exits unsuccessfully", () => {
  let error;

  try {
    execFileSync(process.execPath, ["app.js", "missing-settings.json"], {
      cwd: projectDirectory,
      encoding: "utf8",
      stdio: "pipe"
    });
  } catch (caught) {
    error = caught;
  }

  assert.equal(error?.status, 1);
  assert.match(error?.stderr, /Unable to read settings file/);
});

test("CLI reports malformed settings JSON and exits unsuccessfully", async (t) => {
  const fixtureDirectory = await mkdtemp(
    path.join(tmpdir(), "restaculous-settings-test-")
  );
  t.after(() => rm(fixtureDirectory, { recursive: true, force: true }));

  const settingsPath = path.join(fixtureDirectory, "settings.json");
  await writeFile(settingsPath, "{ invalid json", "utf8");

  let error;
  try {
    execFileSync(process.execPath, ["app.js", settingsPath], {
      cwd: projectDirectory,
      encoding: "utf8",
      stdio: "pipe"
    });
  } catch (caught) {
    error = caught;
  }

  assert.equal(error?.status, 1);
  assert.match(error?.stderr, /Invalid JSON in settings file/);
  assert.doesNotMatch(error?.stderr, /at async readSettings/);
});

test("settings validation reports all invalid top-level fields", () => {
  assert.throws(
    () => validateSettings({}),
    (error) => {
      assert.ok(error instanceof SettingsError);
      assert.match(error.message, /"name" must be a non-empty string/);
      assert.match(error.message, /"directory" must be a non-empty string/);
      assert.match(error.message, /"repository" must be an object/);
      assert.match(error.message, /"config" must be an array/);
      assert.match(error.message, /"models" must be an array/);
      return true;
    }
  );
});

test("settings validation rejects unsupported authentication actions", () => {
  const settings = createValidSettings();
  settings.models[0].authentication.push("publish");

  assert.throws(
    () => validateSettings(settings),
    /contains unsupported actions: publish/
  );
});

test("settings loader accepts a valid relative path", async (t) => {
  const fixtureDirectory = await mkdtemp(
    path.join(tmpdir(), "restaculous-settings-test-")
  );
  t.after(() => rm(fixtureDirectory, { recursive: true, force: true }));

  await writeFile(
    path.join(fixtureDirectory, "settings.json"),
    JSON.stringify(createValidSettings()),
    "utf8"
  );

  const settings = await loadSettings("settings.json", fixtureDirectory);
  assert.equal(settings.name, "Movies");
});

test("workflow runs all stages in order when authentication is enabled", async () => {
  const calls = [];
  const completed = [];
  const services = createWorkflowServices(calls);

  await runWorkflow(
    { authentication: true },
    services,
    (stage) => completed.push(stage)
  );

  const expectedStages = [
    "structure",
    "authentication",
    "models",
    "dals",
    "controllers",
    "routes",
    "validators",
    "tests",
    "base",
    "dependencies",
    "documentation",
    "format",
    "lint"
  ];

  assert.deepEqual(calls, expectedStages);
  assert.deepEqual(completed, expectedStages);
});

test("workflow skips authentication when it is disabled", async () => {
  const calls = [];

  await runWorkflow(
    { authentication: false },
    createWorkflowServices(calls)
  );

  assert.doesNotMatch(calls.join(","), /authentication/);
  assert.equal(calls[0], "structure");
  assert.equal(calls.at(-1), "lint");
});

test("workflow stops immediately after a stage fails", async () => {
  const calls = [];
  const completed = [];
  const services = createWorkflowServices(calls, "controllers");

  await assert.rejects(
    runWorkflow(
      { authentication: false },
      services,
      (stage) => completed.push(stage)
    ),
    /controllers stage failed: simulated failure/
  );

  assert.deepEqual(calls, ["structure", "models", "dals", "controllers"]);
  assert.deepEqual(completed, ["structure", "models", "dals"]);
});

test("route generator emits an ES module authentication import", async (t) => {
  const outputDirectory = await mkdtemp(
    path.join(tmpdir(), "restaculous-cli-test-")
  );
  t.after(() => rm(outputDirectory, { recursive: true, force: true }));

  await mkdir(path.join(outputDirectory, "routes"));

  const settings = {
    directory: outputDirectory,
    models: [
      {
        name: "Movie",
        authentication: ["get"],
        attributes: [],
        relations: []
      }
    ]
  };

  await new Promise((resolve, reject) => {
    generateRoutes(settings, (error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });

  const route = await readFile(
    path.join(outputDirectory, "routes", "movie.js"),
    "utf8"
  );

  assert.match(
    route,
    /import \{ checkAuthToken \} from '\.\.\/lib\/auth\.js';/
  );
  assert.doesNotMatch(route, /require\(/);
});

function createValidSettings() {
  return {
    name: "Movies",
    directory: "./movies-api",
    repository: {
      type: "git",
      url: ""
    },
    authentication: true,
    config: [
      {
        name: "HTTP_PORT",
        value: "process.env.HTTP_PORT || 8000"
      }
    ],
    models: [
      {
        name: "Movie",
        authentication: ["get"],
        attributes: [
          {
            name: "title",
            type: "String"
          }
        ]
      }
    ]
  };
}

function createWorkflowServices(calls, failingStage) {
  const service = (stage) => ({
    generate(settings, callback) {
      calls.push(stage);
      callback(stage === failingStage ? new Error("simulated failure") : null);
    }
  });
  const runner = (stage, method) => ({
    [method](settings, callback) {
      calls.push(stage);
      callback(stage === failingStage ? new Error("simulated failure") : null);
    }
  });

  return {
    structure: service("structure"),
    authentication: service("authentication"),
    models: service("models"),
    dals: service("dals"),
    controllers: service("controllers"),
    routes: service("routes"),
    validators: service("validators"),
    tests: service("tests"),
    base: service("base"),
    dependencies: service("dependencies"),
    documentation: service("documentation"),
    format: runner("format", "runFormatter"),
    lint: runner("lint", "runLinter")
  };
}
