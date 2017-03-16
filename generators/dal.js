/*
 *  Load module dependencies
 */
var events = require('events');
var fs = require('fs');
var pluralize = require('pluralize');

/*
 *  Set file options
 */
var opts = {
    encoding: 'utf8'
};

/*
 *  Dal Generator Flow
 *
 *  1. Read settings file for models
 *  2. Read dal template
 *  3. Replace tokens in dal template
 *  4. Create dal file
 *  5. Iterate through steps 1-5 until all dal files are generated
 */
var workflow = new events.EventEmitter();

/*
 *  readSettings
 *
 *  Reads the `settings.json` file where dals and configuration entries are set.
 *
 *  @param {workflowCallback} cb - The callback to handle end of the dals generation process.
 */
workflow.on('readSettings', function readSettings(cb) {
    fs.readFile('./settings.json', opts, function rf(err, data) {
        if (err) {
            // Error handling
            cb(err);
        }

        var models = JSON.parse(data).models;

        workflow.emit('readDalTemplate', models, cb);
    });
});


/*
 *  readDalTemplate
 *
 *  Reads the `templates/dal.js.template` file where the general structure of the dal is defined.
 *
 *  @param {Object[]} models - The models for which dal files are to be generated
 *  @param {workflowCallback} cb - The callback to handle end of the dals generation process.
 */
workflow.on('readDalTemplate', function readDalTemplate(models, cb) {
    var allModels = models;

    // Make sure that all dals have been generated
    if (allModels.length) {
        var currentModel = allModels.pop();

        fs.readFile('./templates/dal.js.template', opts, function rf(err, dalFile) {
            if (err) {
                // Error handling
                cb(err);
            }

            // Replace the file tokens
            workflow.emit('replaceDalTokens', allModels, currentModel, dalFile, cb);
        });
    } else {
        // Move on to next step of the global flow
        cb(null);
    }
});

/*
 *  replaceDalTokens
 *
 *  Replaces the tokens defined in the template with values for the dal.
 *
 *  @param {Object[]} models - The models for which the files are to be generated
 *  @param {Object}  currentModel - The currently selected model for which the token replacement will be done.
 *  @param {string}  dalFile - The string version of the template file.
 *  @param {workflowCallback} cb - The callback to handle end of the dals generation process.
 */
workflow.on('replaceDalTokens', function replaceDalTokens(models, currentModel, dalFile, cb) {
    var relatedModels = [];

    // Related dals
    if (currentModel.relations.length) {
        currentModel.relations.forEach(function (relation) {
            relatedModels.push(" path: " + relation.toLowerCase());
        });

        dalFile = dalFile.replace(/\{\{relatedModels\}\}/, relatedModels.join(",\n"));
    }

    // Model Name
    dalFile = dalFile.replace(/\{\{modelName\}\}/g, currentModel.name);

    // Model Name in lower case
    dalFile = dalFile.replace(/\{\{modelNameToLower\}\}/g, currentModel.name.toLowerCase());

    // Model Name plural
    dalFile = dalFile.replace(/\{\{modelNamePlural\}\}/g, pluralize(currentModel.name));

    // Model Name in lower case and plural
    dalFile = dalFile.replace(/\{\{modelNamePluralToLower\}\}/g, pluralize(currentModel.name.toLowerCase()));

    // Create the dal file
    workflow.emit('createDalFile', models, currentModel, dalFile, cb);
});

/*
 *  createDalFile
 *
 *  Creates the actual dal file on disk.
 *
 *  @param {Object[]} models - The models for which the files are to be generated
 *  @param {Object}  currentModel - The currently selected model for which the token replacement will be done.
 *  @param {string}  dalFile - The string version of the template file.
 *  @param {workflowCallback} cb - The callback to handle end of the dals generation process.
 */
workflow.on('createDalFile', function createDalFile(models, currentModel, dalFile, cb) {

    fs.writeFile(currentModel.name.toLowerCase() + '_dal.js', dalFile, opts, function rf(err, data) {
        if (err) {
            // Error handling
            cb(err);
        }

        // This is called to iterate through all models
        workflow.emit('readDalTemplate', models, cb);
    });
});

exports.generate = function generateDals(cb) {
    workflow.emit('readSettings', cb);
};


