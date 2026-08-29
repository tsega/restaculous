#!/usr/bin/env node

import chalk from "chalk";

import * as authGenerator from "./generators/auth.js";
import * as baseGenerator from "./generators/base.js";
import * as controllerGenerator from "./generators/controller.js";
import * as dependenciesInstaller from "./generators/dependencies.js";
import * as modelGenerator from "./generators/model.js";
import * as routeGenerator from "./generators/route.js";
import * as structureGenerator from "./generators/structure.js";
import * as testGenerator from "./generators/test.js";
import * as validatorGenerator from "./generators/validator.js";
import * as formatter from "./runners/format.js";
import * as linter from "./runners/lint.js";
import { HELP, parseCliArguments, VERSION } from "./cli/arguments.js";
import { runInit } from "./cli/init.js";
import { STATUS } from "./config/index.js";
import { loadSettings } from "./cli/settings.js";
import { runWorkflow } from "./cli/workflow.js";

const services = {
  structure: structureGenerator,
  authentication: authGenerator,
  models: modelGenerator,
  controllers: controllerGenerator,
  routes: routeGenerator,
  validators: validatorGenerator,
  tests: testGenerator,
  base: baseGenerator,
  dependencies: dependenciesInstaller,
  format: formatter,
  lint: linter
};

const completionMessages = {
  structure: "Done Generating App Structure",
  authentication: "Done Generating Authentication",
  models: "Done Generating Models",
  controllers: "Done Generating Controllers",
  routes: "Done Generating Routes",
  validators: "Done Generating Validators",
  tests: "Done Generating Tests",
  base: "Done Generating config/index.js, routes/index.js and package.json",
  dependencies: "Done Installing Dependencies",
  format: "Done Formatting Code",
  lint: "Done Linting Code"
};

async function main() {
  try {
    const options = parseCliArguments();

    if (options.command === "help") {
      console.log(HELP.trimEnd());
      return;
    }
    if (options.command === "version") {
      console.log(VERSION);
      return;
    }
    if (options.command === "init") {
      const result = await runInit({ settingsPath: options.settingsPath });
      console.log(result.created
        ? chalk.green(`${STATUS.success} Created ${result.path}`)
        : chalk.yellow(`${STATUS.warning} Settings file was not changed`));
      return;
    }

    const settings = await loadSettings(options.settingsPath);
    await runWorkflow(settings, services, reportStageComplete);
  } catch (error) {
    console.error(chalk.red(`${STATUS.error} ${error.message}`));
    if (error.name === "CliUsageError") {
      console.error("Run resta --help for usage.");
    }
    process.exitCode = 1;
  }
}

function reportStageComplete(stage) {
  console.log(chalk.green(`%s ${completionMessages[stage]}`), STATUS.success);
}

main();
