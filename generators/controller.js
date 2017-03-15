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
 *  Controller Generator Flow
 *
 *  1. Read settings file
 *  2. Read controller template
 *  3. Replace tokens in controller template
 *  4. Create controller file
 *  5. Iterate through steps 1-5 until all controller files are generated
 */
var workflow = new events.EventEmitter();

/*
 *  readSettings
 *
 *  Reads the `settings.json` file where models and configuration entries are set.
 *
 *  @param {workflowCallback} cb - The callback to handle end of the models generation process.
 */
workflow.on('readSettings', function readSettings(cb) {
    fs.readFile('./settings.json', opts, function rf(err, data) {
        if (err) {
            // Error handling
            cb(err);
        }

        var models = JSON.parse(data).models;

        workflow.emit('readControllerTemplate', models, cb);
    });
});


/*
 *  readControllerTemplate
 *
 *  Reads the `templates/controller.js.template` file.
 *
 *  @param {Object[]} models - The models for which the files are to be generated
 *  @param {workflowCallback} cb - The callback to handle end of the models generation process.
 */
workflow.on('readControllerTemplate', function readControllerTemplate(models, cb) {
    var allModels = models;

    // Make sure that all models have been generated
    if (allModels.length) {
        var currentModel = allModels.pop();

        fs.readFile('./templates/controller.js.template', opts, function rf(err, controllerFile) {
            if (err) {
                // Error handling
                cb(err);
            }

            // Replace the file tokens
            workflow.emit('replaceControllerTokens', allModels, currentModel, controllerFile, cb);
        });
    } else {
        // Move on to next step of the global flow
        cb(null);
    }
});

/*
 *  replaceControllerTokens
 *
 *  Replaces the tokens defined in the template with values for the model.
 *
 *  @param {Object[]} models - The models for which the files are to be generated
 *  @param {Object}  currentModel - The currently selected model for which the token replacement will be done.
 *  @param {string}  controllerFile - The string version of the template file.
 *  @param {workflowCallback} cb - The callback to handle end of the models generation process.
 */
workflow.on('replaceControllerTokens', function replaceControllerTokens(models, currentModel, modelFile, cb) {
    var relatedModels = [];
    var schemaEntries = [];

    // Related models
    if (currentModel.relations.length) {
        currentModel.relations.forEach(function (relation) {
            relatedModels.push("var " + relation + " = require('./" + relation.toLowerCase() + "');");
            schemaEntries.push(relation.toLowerCase() + ": {type: mongoose.Schema.ObjectId, ref:'" + relation + "'}");
        });

        modelFile = modelFile.replace(/\{\{relatedModels\}\}/, relatedModels.join("\n"));
    }

    // Model Name
    modelFile = modelFile.replace(/\{\{modelName\}\}/g, currentModel.name);

    // Model Schema
    var modelSchema = schemaEntries;

    if (currentModel.attributes.length) {
        currentModel.attributes.forEach(function (attribute) {
            modelSchema.push(attribute.name + ": {type: " + attribute.type + "}");
        });
    }

    modelFile = modelFile.replace(/\{\{modelSchema\}\}/, modelSchema.join(",\n"));

    // Create the model file
    workflow.emit('createModelFile', models, currentModel, modelFile, cb);
});

/*
 *  createControllerFile
 *
 *  Creates the actual controller file on disk.
 *
 *  @param {Object[]} models - The models for which the files are to be generated
 *  @param {Object}  currentModel - The currently selected model for which the token replacement will be done.
 *  @param {string}  controllerFile - The string version of the template file.
 *  @param {workflowCallback} cb - The callback to handle end of the models generation process.
 */
workflow.on('createControllerFile', function createControllerFile(models, currentModel, controllerFile, cb) {

    fs.writeFile(currentModel.name.toLowerCase() + '.js', controllerFile, opts, function rf(err, data) {
        if (err) {
            // Error handling
            cb(err);
        }

        // This is called to iterate through all models
        workflow.emit('readModelTemplate', models, cb);
    });
});

exports.generate = function generateControllers(cb) {
    workflow.emit('readSettings', cb);
};


