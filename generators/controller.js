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
 *  Controller Generator Flow
 *
 *  1. Read controller template
 *  2. Replace tokens in controller template
 *  3. Create controller file
 *  4. Iterate through steps 1-5 until all controller files are generated
 */
var workflow = new events.EventEmitter();
var appSettings = {};

/*
 *  readControllerTemplate
 *
 *  @desc Reads the `templates/controller.js.template` file.
 *
 *  @param {Object[]} models - The models for which the files are to be generated
 *  @param {workflowCallback} cb - The callback to handle end of the models generation process.
 */
workflow.on('readControllerTemplate', function readControllerTemplate(models, cb) {
    var allModels = clone(models);

    // Make sure that all models have been generated
    if (allModels.length) {
        var currentModel = allModels.pop();

        fs.readFile(__dirname + '/../templates/controller.js.template', opts, function rf(err, controllerFile) {
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
 *  @desc Replaces the tokens defined in the template with values for the model.
 *
 *  @param {Object[]} models - The models for which the files are to be generated
 *  @param {Object}  currentModel - The currently selected model for which the token replacement will be done.
 *  @param {string}  controllerFile - The string version of the template file.
 *  @param {workflowCallback} cb - The callback to handle end of the models generation process.
 */
workflow.on('replaceControllerTokens', function replaceControllerTokens(models, currentModel, controllerFile, cb) {

    // Model Name
    controllerFile = controllerFile.replace(/\{\{modelName\}\}/g, currentModel.name);

    // Model Name in lower case
    controllerFile = controllerFile.replace(/\{\{modelNameToLower\}\}/g, currentModel.name.toLowerCase());

    // Model Name plural
    controllerFile = controllerFile.replace(/\{\{modelNamePlural\}\}/g, pluralize(currentModel.name));

    // Model Name in lower case and plural
    controllerFile = controllerFile.replace(/\{\{modelNamePluralToLower\}\}/g, pluralize(currentModel.name.toLowerCase()));

    // Model default field list
    controllerFile = controllerFile.replace(/\{\{modelDefaultFieldList\}\}/g, defaultFieldList(currentModel));

    // Model create action field validation
    controllerFile = controllerFile.replace(/\{\{modelCreateFieldValidation\}\}/g, createActionFieldValidation(currentModel));

    // Model update action field validation
    controllerFile = controllerFile.replace(/\{\{modelUpdateFieldValidation\}\}/g, updateActionFieldValidation(currentModel));

    // Create the controller file
    workflow.emit('createControllerFile', models, currentModel, controllerFile, cb);
});

/*
 *  createControllerFile
 *
 *  @desc Creates the actual controller file on disk.
 *
 *  @param {Object[]} models - The models for which the files are to be generated
 *  @param {Object}  currentModel - The currently selected model for which the token replacement will be done.
 *  @param {string}  controllerFile - The string version of the template file.
 *  @param {workflowCallback} cb - The callback to handle end of the models generation process.
 */
workflow.on('createControllerFile', function createControllerFile(models, currentModel, controllerFile, cb) {

    fs.writeFile(getControllerFileName(currentModel.name), controllerFile, opts, function rf(err, data) {
        if (err) {
            // Error handling
            cb(err);
        }

        // This is called to iterate through all models
        workflow.emit('readControllerTemplate', models, cb);
    });
});

/*
 *  getControllerFileName
 *
 *  @desc Get the full path of where the controller file should be created.
 *
 *  @param {String} modelName - the name of the model.
 *  @returns {String} the full path of the controller file.
 */
function getControllerFileName(modelName){
    return appSettings.directory + "/controllers/" + modelName.toLowerCase() + '.js' ;
}

/*
 *  defaultFieldList
 *
 *  @desc builds the default field list of the model
 *
 *  @param {Object} model - the model for which default field token replacements is generated
 *  @returns {String} the replacement string to put in documentation
 */
function defaultFieldList(model) {
    var tokenReplacement = [];

    model.attributes.forEach(function (attribute) {
        tokenReplacement.push("'" + attribute.name + "'");
    });

    return "[" + tokenReplacement.join(", ") + "]";
}

/*
 *  createActionFieldValidation
 *
 *  @desc builds the field validation token replacement for the 'Create' action
 *
 *  @param {Object} model - the model for which field validation token replacements is generated
 *  @returns {String} the replacement string to put in documentation
 *
 *
 */
function createActionFieldValidation(model) {
    var tokenReplacement = [];

    model.attributes.forEach(function (attribute) {
        tokenReplacement.push("\t\t\t" + attribute.name + ": {");
        if (attribute.isOptional) {
            tokenReplacement.push("\t\t\t\t optional: true,");
            tokenReplacement.push("\t\t\t\t errorMessage: 'Invalid " + attribute.name + "'");
        } else {
            tokenReplacement.push("\t\t\t\t notEmpty: true,");
            tokenReplacement.push("\t\t\t\t errorMessage: 'Invalid " + attribute.name + "'");
        }
        tokenReplacement.push("\t\t\t},");
    });

    return tokenReplacement.join("\n");
}

/*
 *  updateActionFieldValidation
 *
 *  @desc builds the field validation token replacement for the 'Update' action
 *
 *  @param {Object} model - the model for which field validation token replacements is generated
 *  @returns {String} the replacement string to put in documentation
 */
function updateActionFieldValidation(model) {
    var tokenReplacement = [];

    model.attributes.forEach(function (attribute) {
        tokenReplacement.push("\t\t\t" + attribute.name + ": {");
        tokenReplacement.push("\t\t\t\t optional: true,");
        tokenReplacement.push("\t\t\t\t errorMessage: 'Invalid " + attribute.name + "'");
        tokenReplacement.push("\t\t\t},");
    });

    return tokenReplacement.join("\n");
}


exports.generate = function generateControllers(settings, cb) {
    appSettings = settings;
    workflow.emit('readControllerTemplate', appSettings.models, cb);
};


