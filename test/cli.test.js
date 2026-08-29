import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { EventEmitter } from "node:events";
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
import { createLogger, formatErrorDetails } from "../cli/logger.js";
import { runCommand } from "../cli/run-command.js";
import { requestLogger } from "../structure/src/middleware/request-logger.js";

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
    settingsPath: "settings.json",
    verbose: false
  });
  assert.deepEqual(parseCliArguments(["settings.json"]), {
    command: "generate",
    settingsPath: "settings.json",
    verbose: false
  });
});

test("argument parser supports verbose diagnostics without changing -v", () => {
  assert.deepEqual(
    parseCliArguments(["generate", "settings.json", "--verbose"]),
    {
      command: "generate",
      settingsPath: "settings.json",
      verbose: true
    }
  );
  assert.deepEqual(parseCliArguments(["-v"]), { command: "version" });
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
  assert.doesNotMatch(error?.stderr, /\[verbose\]/);
});

test("CLI verbose mode reports diagnostic context for failures", () => {
  let error;

  try {
    execFileSync(
      process.execPath,
      ["app.js", "missing-settings.json", "--verbose"],
      {
        cwd: projectDirectory,
        encoding: "utf8",
        stdio: "pipe"
      }
    );
  } catch (caught) {
    error = caught;
  }

  assert.equal(error?.status, 1);
  assert.match(error?.stderr, /\[verbose\] Loading settings/);
  assert.match(error?.stderr, /\[verbose\] Error details:/);
  assert.match(error?.stderr, /SettingsError/);
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
  assert.equal(
    settings.config.find(({ name }) => name === "TEST_MONGODB_URL").value,
    "mongodb://127.0.0.1:27017/movies-api-test"
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

test("workflow errors identify the failed stage and target application", async () => {
  const services = createWorkflowServices([], "controllers");

  await assert.rejects(
    runWorkflow(
      {
        name: "Movies API",
        directory: "/tmp/movies api",
        authentication: false
      },
      services
    ),
    /controllers stage failed for "Movies API" in "\/tmp\/movies api"/
  );
});

test("command failures include command, directory, and stderr", async (t) => {
  const fixtureDirectory = await mkdtemp(
    path.join(tmpdir(), "restaculous command test ")
  );
  t.after(() => rm(fixtureDirectory, { recursive: true, force: true }));

  await assert.rejects(
    new Promise((resolve, reject) => {
      runCommand(
        process.execPath,
        [
          "-e",
          "process.stderr.write('simulated command failure');process.exit(2)"
        ],
        { cwd: fixtureDirectory },
        (error) => (error ? reject(error) : resolve())
      );
    }),
    (error) => {
      assert.match(error.message, /Command .* failed in/);
      assert.match(error.message, /simulated command failure/);
      assert.equal(error.cwd, fixtureDirectory);
      assert.equal(error.cause.code, 2);
      return true;
    }
  );
});

test("logger only emits diagnostics in verbose mode and follows causes", () => {
  const output = [];
  const cause = new Error("low-level failure");
  const error = new Error("stage failure", { cause });

  createLogger({ write: (message) => output.push(message) }).debug("hidden");
  assert.deepEqual(output, []);

  const logger = createLogger({
    verbose: true,
    write: (message) => output.push(message)
  });
  logger.debug("visible");
  logger.reportError(error);

  assert.equal(output[0], "[verbose] visible");
  assert.match(output.join("\n"), /stage failure/);
  assert.match(output.join("\n"), /Caused by:\nError: low-level failure/);
  assert.match(formatErrorDetails(error), /low-level failure/);
});

test("generated configuration rejects invalid numeric environment values", () => {
  const configUrl = new URL(
    "../structure/src/config/index.js",
    import.meta.url
  ).href;
  let error;

  try {
    execFileSync(
      process.execPath,
      ["--input-type=module", "--eval", `await import(${JSON.stringify(configUrl)})`],
      {
        encoding: "utf8",
        env: {
          ...process.env,
          HTTP_PORT: "not-a-port",
          MONGODB_URL: "mongodb://127.0.0.1:27017/test",
          JWT_KEY: "test-key"
        },
        stdio: "pipe"
      }
    );
  } catch (caught) {
    error = caught;
  }

  assert.notEqual(error, undefined);
  assert.match(error.stderr, /Invalid environment variable HTTP_PORT/);
});

test("generated request logger excludes query values and headers", () => {
  const output = [];
  const originalLog = console.log;
  const response = new EventEmitter();
  response.statusCode = 200;

  try {
    console.log = (message) => output.push(message);
    requestLogger(
      {
        method: "GET",
        path: "/movies",
        originalUrl: "/movies?token=secret",
        headers: { authorization: "Bearer secret" }
      },
      response,
      () => {}
    );
    response.emit("finish");
  } finally {
    console.log = originalLog;
  }

  assert.match(output[0], /INFO HTTP request completed/);
  assert.match(output[0], /method="GET" path="\/movies" status=200/);
  assert.doesNotMatch(output[0], /token|secret|authorization/i);
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
    "src/middleware/request-logger.js",
    "src/utils/logger.js",
    "test/movie.test.js",
    ".env.example",
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

  const environmentExample = await readFile(
    path.join(outputDirectory, ".env.example"),
    "utf8"
  );
  assert.match(environmentExample, /# MongoDB connection URL/);
  assert.match(environmentExample, /MONGODB_URL=/);
  assert.match(
    environmentExample,
    /TEST_MONGODB_URL="mongodb:\/\/127\.0\.0\.1:27017\/movies-test"/
  );
  assert.match(environmentExample, /JWT_KEY=\n/);
  assert.doesNotMatch(environmentExample, /JWT_KEY=.*change-me/);

  const generatedApp = await readFile(
    path.join(outputDirectory, "src/app.js"),
    "utf8"
  );
  assert.match(generatedApp, /app\.use\(requestLogger\)/);

  const testSetup = await readFile(
    path.join(outputDirectory, "test/setup.js"),
    "utf8"
  );
  assert.match(testSetup, /required\("TEST_MONGODB_URL"\)/);
  assert.match(testSetup, /TEST_MONGODB_URL must differ from MONGODB_URL/);
  assert.match(testSetup, /mongoose\.connection\.dropDatabase\(\)/);
  assert.doesNotMatch(testSetup, /mongoose\.connect\(MONGODB_URL\)/);

  const generatedPackage = JSON.parse(
    await readFile(path.join(outputDirectory, "package.json"), "utf8")
  );
  assert.match(generatedPackage.scripts.test, /--test-concurrency=1/);

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
