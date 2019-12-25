#!/usr/bin/env node

/*
 *  Load Module dependencies
 */
var events = require("events");
var fs = require("fs-extra");
var chalk = require("chalk");

// Load config file
var config = require("./config");

//  Set file options
var opts = {
  encoding: "utf8"
};

/*
 *  Load generators
 */
var structureGenerator = require("./generators/structure");
var modelGenerator = require("./generators/model");
var dalGenerator = require("./generators/dal");
var controllerGenerator = require("./generators/controller");
var routeGenerator = require("./generators/route");
var testGenerator = require("./generators/test");
var baseGenerator = require("./generators/base");
var dependenciesInstaller = require("./generators/dependencies");
var documentationGenerator = require("./generators/documentation");
var formatter = require("./generators/format");

/*
 *  Generator high-level flow
 *
 *  1. Read settings from file
 *  2. Copy App Structure
 *  3. Generate Models
 *  4. Generate DALs
 *  5. Generate Controllers
 *  6. Generate Routes
 *  7. Generate Tests
 *  8. Generate Configuration
 *  9. Install App dependencies
 *  10. Generate API Docs
 *  11. Format codebase with Prettier
 */
var workflow = new events.EventEmitter();
var settings = {};

/*
 *  readSettings
 *
 *  @desc Reads the `settings.json` file where models and configuration entries are set.
 */
workflow.on("readSettings", function readSettings() {
  // Get settings file path from the command prompt
  var filePath = process.argv[2];

  if (filePath) {
    fs.readFile(getSettingsFilePath(filePath), opts, function rf(err, data) {
      if (err) {
        // Error handling
        console.log(chalk.red(config.SINGS.error + " " + err.message));
        return false;
      }

      // Convert the settings file into an object
      settings = JSON.parse(data);

      workflow.emit("generateStructure");
    });
  } else {
    // Prompt user to supply setting.json file path
    console.log(
      chalk.yellow("%s Warning: settings.json file not provided!"),
      config.SINGS.warning
    );
  }
});

/*
 *  generateStructure
 *
 *  @desc Copies the boilerplate applications structure
 *
 *  @param {Object} settings - the settings object read from file
 */
workflow.on("generateStructure", function generateStructure() {
  structureGenerator.generate(settings, function(err) {
    if (err) {
      // Output Error to console
      console.log(err);
    }

    console.log(
      chalk.green("%s Done Generating App Structure"),
      config.SINGS.success
    );
    workflow.emit("generateModels");
  });
});

/*
 *  generateModels
 *
 *  @desc Uses the model generator to create model files in the new application structure.
 */
workflow.on("generateModels", function generateModels() {
  modelGenerator.generate(settings, function(err) {
    if (err) {
      // Output Error to console
      console.log(err);
    }

    console.log(chalk.green("%s Done Generating Models"), config.SINGS.success);
    workflow.emit("generateDals");
  });
});

/*
 *  generateDals
 *
 *  @desc Uses the dal generator to create dal files in the new application structure.
 */
workflow.on("generateDals", function generateDals() {
  dalGenerator.generate(settings, function(err) {
    if (err) {
      // Output Error to console
      console.log(err);
    }

    console.log(chalk.green("%s Done Generating Dals"), config.SINGS.success);
    workflow.emit("generateControllers");
  });
});

/*
 *  generateControllers
 *
 *  @desc Uses the dal generator to create dal files in the new application structure.
 */
workflow.on("generateControllers", function generateControllers() {
  controllerGenerator.generate(settings, function(err) {
    if (err) {
      // Output Error to console
      console.log(err);
    }

    console.log(
      chalk.green("%s Done Generating Controllers"),
      config.SINGS.success
    );
    workflow.emit("generateRoutes");
  });
});

/*
 *  generateRoutes
 *
 *  @desc Uses the dal generator to create dal files in the new application structure.
 */
workflow.on("generateRoutes", function generateRoutes() {
  routeGenerator.generate(settings, function(err) {
    if (err) {
      // Output Error to console
      console.log(err);
    }

    console.log(chalk.green("%s Done Generating Routes"), config.SINGS.success);
    workflow.emit("generateTests");
  });
});

/*
 *  generateTests
 *
 *  @desc Uses the test generator to create test files in the new application structure.
 */
workflow.on("generateTests", function generateTest() {
  testGenerator.generate(settings, function(err) {
    if (err) {
      // Output Error to console
      console.log(err);
    }

    console.log(chalk.green("%s Done Generating Tests"), config.SINGS.success);
    workflow.emit("generateBase");
  });
});

/*
 *  generateBase
 *
 *  @desc Uses the base generator to create config/index.js and routes/index.js files in the new application structure.
 */
workflow.on("generateBase", function generateBase() {
  baseGenerator.generate(settings, function(err) {
    if (err) {
      // Output Error to console
      console.log(err);
    }

    console.log(
      chalk.green(
        "%s Done Generating config/index.js, routes/index.js and package.json"
      ),
      config.SINGS.success
    );
    workflow.emit("installDependencies");
  });
});

/*
 *  installDependencies
 *
 *  @desc Uses the dependencies generator to install NPM modules needed by the app.
 */
workflow.on("installDependencies", function installDependencies() {
  dependenciesInstaller.generate(settings, function(err) {
    if (err) {
      // Output Error to console
      console.log(err);
    }

    console.log(
      chalk.green("%s Done Installing Dependencies"),
      config.SINGS.success
    );

    workflow.emit("generateDocumentation");
  });
});

/*
 *  generateDocumentation
 *
 *  @desc Uses the documentation generator to generate the API documentation.
 */
workflow.on("generateDocumentation", function generateDocumentation() {
    documentationGenerator.generate(settings, function(err) {
      if (err) {
        // Output Error to console
        console.log(err);
      }

      console.log(
        chalk.green("%s Done Generating Documentation"),
        config.SINGS.success
      );

      workflow.emit("format");
    });
  });

/*
 *  format
 *
 *  @desc Uses Prettier to format codebase.
 */
workflow.on("format", function runFormatter() {
  formatter.runFormatter(settings, function(err) {
    if (err) {
      // Output Error to console
      console.log(err);
    }

    console.log(
      chalk.green("%s Done Formatting Code"),
      config.SINGS.success
    );
  });
});

/*
 *  getSettingsFilePath
 *
 *  @desc Figures out the actual system path to the settings.json file
 *
 *  @parma {String} filePath - the file path provided by the user
 */
function getSettingsFilePath(filePath) {
  if (filePath.indexOf("/") < 0) {
    return "./" + filePath;
  } else {
    return filePath;
  }
}

workflow.emit("readSettings");
