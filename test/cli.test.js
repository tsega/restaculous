import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { generate as generateRoutes } from "../generators/route.js";
import { generate as generateStructure } from "../generators/structure.js";
import { generate as generateAuthentication } from "../generators/auth.js";
import { generate as generateModels } from "../generators/model.js";
import { generate as generateControllers } from "../generators/controller.js";
import { generate as generateValidators } from "../generators/validator.js";
import { generate as generateTests } from "../generators/test.js";
import { generate as generateBase } from "../generators/base.js";
import {
  loadSettings,
  SettingsError,
  validateSettings
} from "../cli/settings.js";
import { runWorkflow } from "../cli/workflow.js";
import { runInit } from "../cli/init.js";
import {
  CliUsageError,
  parseCliArguments,
  VERSION
} from "../cli/arguments.js";

const projectDirectory = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);

test("CLI displays help when no command is provided", () => {
  const output = execFileSync(process.execPath, ["app.js"], {
    cwd: projectDirectory,
    encoding: "utf8"
  });

  assert.match(output, /Usage:/);
  assert.match(output, /resta init/);
});

test("CLI displays help and version flags", () => {
  const help = execFileSync(process.execPath, ["app.js", "--help"], {
    cwd: projectDirectory,
    encoding: "utf8"
  });
  const version = execFileSync(process.execPath, ["app.js", "--version"], {
    cwd: projectDirectory,
    encoding: "utf8"
  });

  assert.match(help, /Generate an opinionated Express and Mongoose REST API/);
  assert.equal(version.trim(), VERSION);
});

test("package exposes resta with the original command as an alias", async () => {
  const packageInfo = JSON.parse(
    await readFile(path.join(projectDirectory, "package.json"), "utf8")
  );

  assert.equal(packageInfo.bin.resta, "./app.js");
  assert.equal(packageInfo.bin.restaculous, "./app.js");
});

test("argument parser supports explicit and legacy generate commands", () => {
  assert.deepEqual(parseCliArguments(["generate", "settings.json"]), {
    command: "generate",
    settingsPath: "settings.json"
  });
  assert.deepEqual(parseCliArguments(["settings.json"]), {
    command: "generate",
    settingsPath: "settings.json"
  });
});

test("argument parser rejects invalid commands and options", () => {
  assert.throws(
    () => parseCliArguments(["generate"]),
    CliUsageError
  );
  assert.throws(
    () => parseCliArguments(["unknown", "value"]),
    /Unknown command/
  );
  assert.throws(
    () => parseCliArguments(["--unknown"]),
    CliUsageError
  );
});

test("CLI init creates a minimal validated settings file", async (t) => {
  const fixtureDirectory = await mkdtemp(
    path.join(tmpdir(), "restaculous-init-test-")
  );
  t.after(() => rm(fixtureDirectory, { recursive: true, force: true }));

  const answers = [
    "Movies API",
    "",
    "A generated movie API",
    "",
    "",
    "n",
    "Movie",
    "title:String,year:Number",
    ""
  ];
  const result = await runInit({
    cwd: fixtureDirectory,
    ask: async () => answers.shift()
  });

  const contents = JSON.parse(
    await readFile(path.join(fixtureDirectory, "settings.json"), "utf8")
  );
  const settings = validateSettings(contents);

  assert.equal(result.created, true);
  assert.equal(contents.directory, "./movies-api");
  assert.equal(settings.models[0].name, "Movie");
  assert.equal(settings.models[0].attributes[1].type, "Number");
});

test("CLI init does not overwrite an existing settings file without confirmation", async (t) => {
  const fixtureDirectory = await mkdtemp(
    path.join(tmpdir(), "restaculous-init-test-")
  );
  t.after(() => rm(fixtureDirectory, { recursive: true, force: true }));

  const settingsPath = path.join(fixtureDirectory, "settings.json");
  await writeFile(settingsPath, "existing contents\n", "utf8");

  const result = await runInit({
    cwd: fixtureDirectory,
    ask: async () => "n"
  });

  assert.equal(result.created, false);
  assert.equal(await readFile(settingsPath, "utf8"), "existing contents\n");
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

test("settings validation reports required top-level fields", () => {
  assert.throws(
    () => validateSettings({}),
    (error) => {
      assert.ok(error instanceof SettingsError);
      assert.match(error.message, /"name" invalid input/);
      assert.match(error.message, /"directory" invalid input/);
      return true;
    }
  );
});

test("settings validation rejects unsupported authentication actions", () => {
  const settings = createValidSettings();
  settings.models[0].authentication.push("publish");

  assert.throws(
    () => validateSettings(settings),
    /models\.0\.authentication\.1.*expected one of/
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

test("settings validation supplies defaults for minimal configuration", () => {
  const settings = validateSettings({
    name: "Movies API",
    directory: "./movies-api"
  });

  assert.equal(settings.authentication, false);
  assert.deepEqual(settings.models, []);
  assert.equal(
    settings.config.find(({ name }) => name === "MONGODB_URL").value,
    "mongodb://127.0.0.1:27017/movies-api"
  );
});

test("models generate all CRUD routes by default", () => {
  const settings = validateSettings({
    name: "Movies",
    directory: "./movies-api",
    models: [{ name: "Movie" }]
  });

  assert.deepEqual(settings.models[0].routes, [
    "get",
    "post",
    "put",
    "delete",
    "search"
  ]);
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
    "controllers",
    "routes",
    "validators",
    "tests",
    "base",
    "dependencies",
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

  assert.deepEqual(calls, ["structure", "models", "controllers"]);
  assert.deepEqual(completed, ["structure", "models"]);
});

test("route generator emits an ES module authentication import", async (t) => {
  const outputDirectory = await mkdtemp(
    path.join(tmpdir(), "restaculous-cli-test-")
  );
  t.after(() => rm(outputDirectory, { recursive: true, force: true }));

  await mkdir(path.join(outputDirectory, "src", "routes"), { recursive: true });

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
    path.join(outputDirectory, "src", "routes", "movie.js"),
    "utf8"
  );

  assert.match(
    route,
    /import \{ checkAuthToken \} from "\.\.\/middleware\/auth\.js";/
  );
  assert.doesNotMatch(route, /require\(/);
});

test("generators produce a clean src-based application without a DAL", async (t) => {
  const outputDirectory = await mkdtemp(
    path.join(tmpdir(), "restaculous-generated-app-")
  );
  t.after(() => rm(outputDirectory, { recursive: true, force: true }));

  const settings = validateSettings({
    name: "Movies",
    directory: outputDirectory,
    authentication: true,
    models: [
      {
        name: "Movie",
        routes: ["get", "search"],
        authentication: ["get"],
        attributes: [{ name: "title", type: "String" }]
      }
    ]
  });

  for (const generate of [
    generateStructure,
    generateAuthentication,
    generateModels,
    generateControllers,
    generateRoutes,
    generateValidators,
    generateTests,
    generateBase
  ]) {
    await runGenerator(generate, settings);
  }

  const expectedFiles = [
    "src/app.js",
    "src/server.js",
    "src/controllers/movie.js",
    "src/models/movie.js",
    "src/routes/movie.js",
    "src/services/auth.js",
    "src/middleware/errors.js",
    "test/movie.test.js",
    "package.json"
  ];
  for (const file of expectedFiles) {
    await readFile(path.join(outputDirectory, file), "utf8");
  }

  await assert.rejects(readFile(path.join(outputDirectory, "dal", "movie.js")));

  const movieRoute = await readFile(
    path.join(outputDirectory, "src/routes/movie.js"),
    "utf8"
  );
  assert.match(movieRoute, /router\.get\("\/search"/);
  assert.match(movieRoute, /router\.get\("\/:movieId"/);
  assert.doesNotMatch(movieRoute, /router\.(post|put|delete)\(/);

  const files = execFileSync("find", [outputDirectory, "-name", "*.js"], {
    encoding: "utf8"
  }).trim().split("\n");
  for (const file of files) {
    execFileSync(process.execPath, ["--check", file], { stdio: "pipe" });
    assert.doesNotMatch(await readFile(file, "utf8"), /\{\{[^}]+\}\}/);
  }
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
    controllers: service("controllers"),
    routes: service("routes"),
    validators: service("validators"),
    tests: service("tests"),
    base: service("base"),
    dependencies: service("dependencies"),
    format: runner("format", "runFormatter"),
    lint: runner("lint", "runLinter")
  };
}

function runGenerator(generate, settings) {
  return new Promise((resolve, reject) => {
    generate(settings, (error) => error ? reject(error) : resolve());
  });
}
