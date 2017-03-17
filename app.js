/*
 *  Load Module dependencies
 */
var events = require('events');
var fs = require('fs-extra');

/*
 *  Set file options
 */
var opts = {
    encoding: 'utf8'
};

/*
 *  Load generators
 */
var structureGenerator = require('./generators/structure');
var modelGenerator = require('./generators/model');
var dalGenerator = require('./generators/dal');
var controllerGenerator = require('./generators/controller');
var routeGenerator = require('./generators/route');
var testGenerator = require('./generators/test');

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
 *  9. Generate API Docs
 *  10. Generate Codebase Docs
 */
var workflow = new events.EventEmitter();
var settings = {};

/*
 *  readSettings
 *
 *  @desc Reads the `settings.json` file where models and configuration entries are set.
 */
workflow.on('readSettings', function readSettings() {
    fs.readFile('./settings.json', opts, function rf(err, data) {
        if (err) {
            // Error handling
            cb(err);
        }

        // Convert the settings file into an object
        settings = JSON.parse(data);

        workflow.emit('generateStructure');
    });
});

/*
 *  generateStructure
 *
 *  @desc Copies the boilerplate applications structure
 *
 *  @param {Object} settings - the settings object read from file
 */
workflow.on('generateStructure', function generateStructure(){
    structureGenerator.generate(settings, function (err) {
        if (err) {
            // Output Error to console
            console.log(err);
        }

        console.log("Done Generating App Structure");
        workflow.emit('generateModels');
    });
});


/*
 *  generateModels
 *
 *  @desc Uses the model generator to create model files in the new application structure.
 */
workflow.on('generateModels', function generateModels() {
    modelGenerator.generate(settings, function (err) {
        if (err) {
            // Output Error to console
            console.log(err);
        }

        console.log("Done Generating Models");
        workflow.emit('generateDals');
    });
});


/*
 *  generateDals
 *
 *  @desc Uses the dal generator to create dal files in the new application structure.
 */
workflow.on('generateDals', function generateDals() {
    dalGenerator.generate(settings, function (err) {
        if (err) {
            // Output Error to console
            console.log(err);
        }

        console.log("Done Generating Dals");
        workflow.emit('generateControllers');
    });
});


/*
 *  generateControllers
 *
 *  @desc Uses the dal generator to create dal files in the new application structure.
 */
workflow.on('generateControllers', function generateControllers() {
    controllerGenerator.generate(settings, function (err) {
        if (err) {
            // Output Error to console
            console.log(err);
        }


        console.log("Done Generating Controllers");
        workflow.emit('generateRoutes');
    });
});

/*
 *  generateRoutes
 *
 *  @desc Uses the dal generator to create dal files in the new application structure.
 */
workflow.on('generateRoutes', function generateRoutes() {
    routeGenerator.generate(settings, function (err) {
        if (err) {
            // Output Error to console
            console.log(err);
        }

        console.log("Done Generating Routes");
        workflow.emit('generateTests');
    });
});

/*
 *  generateTests
 *
 *  @desc Uses the test generator to create test files in the new application structure.
 */
workflow.on('generateTests', function generateTest() {
    testGenerator.generate(settings, function (err) {
        if (err) {
            // Output Error to console
            console.log(err);
        }

        console.log("Done Generating Tests");
        //workflow.emit('generateConfig');
    });
});

workflow.emit("readSettings");
