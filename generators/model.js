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
 *  Model Generator Flow
 *
 *  1. Read model template
 *  2. Replace tokens in model template
 *  3. Create model file
 *  4. Iterate through steps 1-5 until all model files are generated
 */
var workflow = new events.EventEmitter();
var appSettings = {};


/*
 *  readModelTemplate
 *
 *  Reads the `templates/model.js.template` file where the general structure of the model is defined.
 *
 *  @param {Object[]} models - The models for which the files are to be generated
 *  @param {workflowCallback} cb - The callback to handle end of the models generation process.
 */
workflow.on('readModelTemplate', function readModelTemplate(models, cb) {
    var allModels = clone(models);

    // Make sure that all models have been generated
    if (allModels.length) {
        var currentModel = allModels.pop();

        fs.readFile(__dirname + '/../templates/model.js.template', opts, function rf(err, modelFile) {
            if (err) {
                // Error handling
                cb(err);
            }

            // Replace the file tokens
            workflow.emit('replaceModelTokens', allModels, currentModel, modelFile, cb);
        });
    } else {
        // Move on to next step of the global flow
        cb(null);
    }
});

/*
 *  replaceModelTokens
 *
 *  Replaces the tokens defined in the template with values for the model.
 *
 *  @param {Object[]} models - The models for which the files are to be generated
 *  @param {Object}  currentModel - The currently selected model for which the token replacement will be done.
 *  @param {string}  modelFile - The string version of the template file.
 *  @param {workflowCallback} cb - The callback to handle end of the models generation process.
 */
workflow.on('replaceModelTokens', function replaceModelTokens(models, currentModel, modelFile, cb) {
    var relatedModels = [];
    var schemaEntries = [];

    // Related models
    if (currentModel.relations && currentModel.relations.length) {
        currentModel.relations.forEach(function (relation) {
            schemaEntries.push(getRelatedModelSchemaEntry(relation));
        });
    }

    // Model Name
    modelFile = modelFile.replace(/\{\{modelName\}\}/g, currentModel.name);

    // Model Schema
    var modelSchema = schemaEntries;

    if (currentModel.attributes.length) {
        currentModel.attributes.forEach(function (attribute) {
            modelSchema.push("\t\t" + attribute.name + ": {type: " + attribute.type + "}");
        });
    }

    modelFile = modelFile.replace(/\{\{modelSchema\}\}/, modelSchema.join(",\n"));

    // Create the model file
    workflow.emit('createModelFile', models, currentModel, modelFile, cb);
});

/*
 *  createModelFile
 *
 *  Creates the actual model file on disk.
 *
 *  @param {Object[]} models - The models for which the files are to be generated
 *  @param {Object}  currentModel - The currently selected model for which the token replacement will be done.
 *  @param {string}  modelFile - The string version of the template file.
 *  @param {workflowCallback} cb - The callback to handle end of the models generation process.
 */
workflow.on('createModelFile', function createModelFile(models, currentModel, modelFile, cb) {

    fs.writeFile(getModelFileName(currentModel.name), modelFile, opts, function rf(err, data) {
        if (err) {
            // Error handling
            cb(err);
        }

        // This is called to iterate through all models
        workflow.emit('readModelTemplate', models, cb);
    });
});

/*
 *  relatedModelSchemaEntry
 *
 *  @desc Build the token for the related model schema entry, i.e. single reference vs. multiple reference.
 *
 *  @param {Object} relation - an object with the name of the related field and its reference type.
 *  @return {String} the token replace for establishing a relationship between the models.
 */
function getRelatedModelSchemaEntry(relation){
    if(relation.referenceType == 'multiple'){
        // enclose in an array
        return pluralize(relation.name.toLowerCase()) + ": [{type: mongoose.Schema.ObjectId, ref:'" + relation.name + "'}]";
    } else {
        return relation.name.toLowerCase() + ": {type: mongoose.Schema.ObjectId, ref:'" + relation.name + "'}";
    }
}

/*
 *  getModelFileName
 *
 *  @desc Get the full path of where the model file should be created.
 *
 *  @param {String} modelName - the name of the model.
 *  @returns {String} the full path of the model file.
 */
function getModelFileName(modelName){
    return appSettings.directory + "/models/" + modelName.toLowerCase() + '.js' ;
}

exports.generate = function generateModels(settings, cb) {
    appSettings = settings;
    workflow.emit('readModelTemplate', appSettings.models, cb);
};


