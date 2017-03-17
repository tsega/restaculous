/*
 *  Load module dependencies
 */
var events = require('events');
var fs = require('fs-extra');
var clone = require('clone');
var pluralize = require('pluralize');

/*
 *  Set file options
 */
var opts = {
    encoding: 'utf8'
};

/*
 *  Test Generator Flow
 *
 *  1. Read test template
 *  2. Replace tokens in test template
 *  3. Create test file
 *  4. Iterate through steps 1-5 until all test files are generated
 */
var workflow = new events.EventEmitter();
var appSettings = {};


/*
 *  readTestTemplate
 *
 *  Reads the `templates/test.js.template` file.
 *
 *  @param {Object[]} models - The models for which the files are to be generated
 *  @param {workflowCallback} cb - The callback to handle end of the models generation process.
 */
workflow.on('readTestTemplate', function readTestTemplate(models, cb) {
    var allModels = clone(models);

    // Make sure that all models have been generated
    if (allModels.length) {
        var currentModel = allModels.pop();

        fs.readFile('./templates/test.js.template', opts, function rf(err, testFile) {
            if (err) {
                // Error handling
                cb(err);
            }

            // Replace the file tokens
            workflow.emit('replaceTestTokens', allModels, currentModel, testFile, cb);
        });
    } else {
        // Move on to next step of the global flow
        cb(null);
    }
});

/*
 *  replaceTestTokens
 *
 *  Replaces the tokens defined in the template with values for the model.
 *
 *  @param {Object[]} models - The models for which the files are to be generated
 *  @param {Object}  currentModel - The currently selected model for which the token replacement will be done.
 *  @param {string}  testFile - The string version of the template file.
 *  @param {workflowCallback} cb - The callback to handle end of the models generation process.
 */
workflow.on('replaceTestTokens', function replaceTestTokens(models, currentModel, testFile, cb) {
    // Model Name
    testFile = testFile.replace(/\{\{modelName\}\}/g, currentModel.name);

    // Model Name in lower case
    testFile = testFile.replace(/\{\{modelNameToLower\}\}/g, currentModel.name.toLowerCase());

    // Model Name plural
    testFile = testFile.replace(/\{\{modelNamePlural\}\}/g, pluralize(currentModel.name));

    // Model Name in lower case and plural
    testFile = testFile.replace(/\{\{modelNamePluralToLower\}\}/g, pluralize(currentModel.name.toLowerCase()));

    // Model sample document from fields
    testFile = testFile.replace(/\{\{modelFields\}\}/g, modelFields(currentModel));

    // Create the model file
    workflow.emit('createTestFile', models, currentModel, testFile, cb);
});

/*
 *  createTestFile
 *
 *  Creates the actual test file on disk.
 *
 *  @param {Object[]} models - The models for which the files are to be generated
 *  @param {Object}  currentModel - The currently selected model for which the token replacement will be done.
 *  @param {string}  testFile - The string version of the template file.
 *  @param {workflowCallback} cb - The callback to handle end of the models generation process.
 */
workflow.on('createTestFile', function createTestFile(models, currentModel, testFile, cb) {

    fs.writeFile(getTestFileName(currentModel.name), testFile, opts, function rf(err, data) {
        if (err) {
            // Error handling
            cb(err);
        }

        // This is called to iterate through all models
        workflow.emit('readTestTemplate', models, cb);
    });
});

/*
 *  modelFields
 *
 *  @desc builds the sample document based on the fields of the model
 *
 *  @param {Object} model - the model for which default field token replacements is generated
 *  @returns {String} the replacement string
 */
function modelFields(model) {
    var tokenReplacement = [];

    model.attributes.forEach(function (attribute) {
        // TODO: check the output to be string or int
        tokenReplacement.push("\t\t" + attribute.name + ":'" + attribute.example + "'");
    });

    return tokenReplacement.join(",\n") ;
}

/*
 *  getTestFileName
 *
 *  @desc Get the full path of where the test file should be created.
 *
 *  @param {String} modelName - the name of the model.
 *  @returns {String} the full path of the test file.
 */
function getTestFileName(modelName){
    return appSettings.directory + "/test/" + modelName.toLowerCase() + '.js' ;
}

exports.generate = function generateTests(settings, cb) {
    appSettings = settings;
    workflow.emit('readTestTemplate', settings.models, cb);
};


