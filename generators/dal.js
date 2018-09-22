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
 *  Dal Generator Flow
 *
 *  1. Read dal template
 *  2. Replace tokens in dal template
 *  3. Create dal file
 *  4. Iterate through steps 1-5 until all dal files are generated
 */
var workflow = new events.EventEmitter();
var appSettings = {};


/*
 *  readDalTemplate
 *
 *  Reads the `templates/dal.js.template` file where the general structure of the dal is defined.
 *
 *  @param {Object[]} models - The models for which dal files are to be generated
 *  @param {workflowCallback} cb - The callback to handle end of the dals generation process.
 */
workflow.on('readDalTemplate', function readDalTemplate(models, cb) {
    var allModels = clone(models);

    // Make sure that all dals have been generated
    if (allModels.length) {
        var currentModel = allModels.pop();

        fs.readFile(__dirname + '/../templates/dal.js.template', opts, function rf(err, dalFile) {
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
    if (currentModel.relations && currentModel.relations.length) {
        currentModel.relations.forEach(function (relation) {
            relatedModels.push(getRelatedModelPath(relation));
        });

        dalFile = dalFile.replace(/\{\{relatedModels\}\}/, relatedModels.join(",\n"));
    } else {
        // Simply remove that related models token in the dal file
        dalFile = dalFile.replace(/\{\{relatedModels\}\}/, "");
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
    fs.writeFile(getDalFileName(currentModel.name), dalFile, opts, function rf(err, data) {
        if (err) {
            // Error handling
            cb(err);
        }

        // This is called to iterate through all models
        workflow.emit('readDalTemplate', models, cb);
    });
});

/*
 *  getRelatedModelPath
 *
 *  @desc Get the path entry for related models to use in populate() method.
 *
 *  @param {Object} relation - the object containing the name of the related model and its reference type
 *  @return {String} - the path token describing how to populate the related model.
 */
function getRelatedModelPath(relation){
    if(relation.referenceType == "multiple"){
        return "\t{ path: '" + pluralize(relation.name.toLowerCase()) + "', options: { limit: 10 }}";
    } else {
        return "\t{ path: '" + relation.name.toLowerCase() + "'}";
    }
}

/*
 *  getDalFileName
 *
 *  @desc Get the full path of where the DAL file should be created.
 *
 *  @param {String} modelName - the name of the model.
 *  @returns {String} the full path of the DAL file.
 */
function getDalFileName(modelName){
    return appSettings.directory + "/dal/" + modelName.toLowerCase() + '.js' ;
}

exports.generate = function generateDals(settings, cb) {
    appSettings = settings;
    workflow.emit('readDalTemplate', appSettings.models, cb);
};


