/*
 *  Load Module dependencies
 */
var events = require('events');

/*
 *  Load generators
 */
var modelGenerator = require('./generators/model');
var dalGenerator = require('./generators/dal');
var controllerGenerator = require('./generators/controller');
var routeGenerator = require('./generators/route');
var testGenerator = require('./generators/test');

/*
 *  Generator high-level flow
 *
 *  1. Copy App Structure
 *  2. Generate Models
 *  3. Generate DALs
 *  4. Generate Controllers
 *  5. Generate Routes
 *  6. Generate Tests
 *  7. Generate Configuration
 *  8. Generate API Docs
 *  9. Generate Codebase Docs
 */
var workflow = new events.EventEmitter();

/*
 *  generateModels
 *
 *  @desc Uses the model generator to create model files in the new application structure.
 */
workflow.on('generateModels', function generateModels() {
    modelGenerator.generate(function (err) {
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
    dalGenerator.generate(function (err) {
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
    controllerGenerator.generate(function (err) {
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
    routeGenerator.generate(function (err) {
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
    testGenerator.generate(function (err) {
        if (err) {
            // Output Error to console
            console.log(err);
        }

        console.log("Done Generating Tests");
        //workflow.emit('generateConfig');
    });
});

workflow.emit("generateModels");
