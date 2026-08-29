#!/usr/bin/env node

import chalk from "chalk";

import * as authGenerator from "./generators/auth.js";
import * as baseGenerator from "./generators/base.js";
import * as controllerGenerator from "./generators/controller.js";
import * as dalGenerator from "./generators/dal.js";
import * as dependenciesInstaller from "./generators/dependencies.js";
import * as documentationGenerator from "./generators/documentation.js";
import * as modelGenerator from "./generators/model.js";
import * as routeGenerator from "./generators/route.js";
import * as structureGenerator from "./generators/structure.js";
import * as testGenerator from "./generators/test.js";
import * as validatorGenerator from "./generators/validator.js";
import * as formatter from "./runners/format.js";
import * as linter from "./runners/lint.js";
import { STATUS } from "./config/index.js";
import { loadSettings } from "./cli/settings.js";
import { runWorkflow } from "./cli/workflow.js";

const services = {
  structure: structureGenerator,
  authentication: authGenerator,
  models: modelGenerator,
  dals: dalGenerator,
  controllers: controllerGenerator,
  routes: routeGenerator,
  validators: validatorGenerator,
  tests: testGenerator,
  base: baseGenerator,
  dependencies: dependenciesInstaller,
  documentation: documentationGenerator,
  format: formatter,
  lint: linter
};

const completionMessages = {
  structure: "Done Generating App Structure",
  authentication: "Done Generating Authentication",
  models: "Done Generating Models",
  dals: "Done Generating Dals",
  controllers: "Done Generating Controllers",
  routes: "Done Generating Routes",
  validators: "Done Generating Validators",
  tests: "Done Generating Tests",
  base: "Done Generating config/index.js, routes/index.js and package.json",
  dependencies: "Done Installing Dependencies",
  documentation: "Done Generating Documentation",
  format: "Done Formatting Code",
  lint: "Done Linting Code"
};

async function main() {
  const filePath = process.argv[2];

  if (!filePath) {
    console.log(
      chalk.yellow("%s Warning: settings.json file not provided!"),
      STATUS.warning
    );
    return;
  }

  try {
    const settings = await loadSettings(filePath);
    await runWorkflow(settings, services, reportStageComplete);
  } catch (error) {
    console.error(chalk.red(`${STATUS.error} ${error.message}`));
    process.exitCode = 1;
  }
}

function reportStageComplete(stage) {
  console.log(chalk.green(`%s ${completionMessages[stage]}`), STATUS.success);
}

main();
