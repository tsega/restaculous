/*
 *  Load module dependencies
 */
import events from 'events';
import fs from 'fs-extra';
import clone from 'clone';
import pluralize from 'pluralize';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/*
 *  Set file options
 */
const opts = {
    encoding: 'utf8'
};

/*
 *  Validator Generator Flow
 *
 *  1. Read validator template
 *  2. Replace tokens in validator template
 *  3. Create validator file
 *  4. Iterate through steps 1-4 until all validator files are generated
 */
const workflow = new events.EventEmitter();
let appSettings = {};

/*
 *  readValidatorTemplate
 *
 *  @desc Reads the `templates/validator.js.template` file.
 *
 *  @param {Object[]} models - The models for which the files are to be generated
 *  @param {workflowCallback} cb - The callback to handle end of the models generation process.
 */
workflow.on('readValidatorTemplate', function (models, cb) {
    let allModels = clone(models);

    // Make sure that all models have been generated
    if (allModels.length) {
        let currentModel = allModels.pop();

        fs.readFile(__dirname + '/../templates/validator.js.template', opts, function rf(err, validatorFile) {
            if (err) {
                // Error handling
                return cb(err);
            }

            // Replace the file tokens
            workflow.emit('replaceValidatorTokens', allModels, currentModel, validatorFile, cb);
        });
    } else {
        // Move on to next step of the global flow
        cb(null);
    }
});

/*
 *  replaceValidatorTokens
 *
 *  @desc Replaces the tokens defined in the template with values for the model.
 *
 *  @param {Object[]} models - The models for which the files are to be generated
 *  @param {Object}  currentModel - The currently selected model for which the token replacement will be done.
 *  @param {string}  validatorFile - The string version of the template file.
 *  @param {workflowCallback} cb - The callback to handle end of the models generation process.
 */
workflow.on('replaceValidatorTokens', function replaceValidatorTokens(models, currentModel, validatorFile, cb) {

    // Model Name
    validatorFile = validatorFile.replace(/\{\{modelName\}\}/g, currentModel.name);

    // Model Name in lower case
    validatorFile = validatorFile.replace(/\{\{modelNameToLower\}\}/g, currentModel.name.toLowerCase());
    const hasBodyValidation = currentModel.attributes.some(
        (attribute) => attribute.validation?.length
    );
    validatorFile = validatorFile.replace(
        /\{\{validatorImports\}\}/g,
        hasBodyValidation ? "body, param" : "param"
    );

    // Model create action field validation
    validatorFile = validatorFile.replace(/\{\{postFieldValidation\}\}/g, postFieldValidation(currentModel));

    // Model update action field validation
    validatorFile = validatorFile.replace(/\{\{putFieldValidation\}\}/g, putFieldValidation(currentModel));

    // Create the validator file
    workflow.emit('createValidatorFile', models, currentModel, validatorFile, cb);
});

/*
 *  createValidatorFile
 *
 *  @desc Creates the actual validator file on disk.
 *
 *  @param {Object[]} models - The models for which the files are to be generated
 *  @param {Object}  currentModel - The currently selected model for which the token replacement will be done.
 *  @param {string}  validatorFile - The string version of the template file.
 *  @param {workflowCallback} cb - The callback to handle end of the models generation process.
 */
workflow.on('createValidatorFile', function createValidatorFile(models, currentModel, validatorFile, cb) {

    fs.writeFile(getValidatorFileName(currentModel.name), validatorFile, opts, function rf(err, data) {
        if (err) {
            // Error handling
            return cb(err);
        }

        // This is called to iterate through all models
        workflow.emit('readValidatorTemplate', models, cb);
    });
});

/*
 *  getValidatorFileName
 *
 *  @desc Get the full path of where the validator file should be created.
 *
 *  @param {String} modelName - the name of the model.
 *  @returns {String} the full path of the validator file.
 */
function getValidatorFileName(modelName){
    return `${appSettings.directory}/src/routes/validators/${modelName.toLowerCase()}.js` ;
}

/*
 *  postFieldValidation
 *
 *  @desc builds the field validation token replacement for the 'POST' action
 *
 *  @param {Object} model - the model for which field validation token replacements is generated
 *  @returns {String} the replacement string to put in documentation
 */
function postFieldValidation(model) {
    let tokenReplacement = "";

    model.attributes.forEach(function (attribute) {
        // Validation based on setting
        if(attribute.validation) {
            attribute.validation.forEach(function(option) {
                tokenReplacement += `
                    body("${attribute.name}", "${option.message}")
                        .${option.type}(),`;
            });
        }
    });

    return tokenReplacement;
}

/*
 *  putFieldValidation
 *
 *  @desc builds the field validation token replacement for the 'PUT' action
 *
 *  @param {Object} model - the model for which field validation token replacements is generated
 *  @returns {String} the replacement string to put in documentation
 */
function putFieldValidation(model) {
  let tokenReplacement = "";

  model.attributes.forEach(function (attribute) {
      // Validation based on setting
      if(attribute.validation) {
        let validatorList = attribute.validation.filter(o => !["isEmpty", "notEmpty"].includes(o.type));

        validatorList.forEach(function(option) {
          tokenReplacement += `
                body("${attribute.name}", "${option.message}")
                  .optional()
                  .${option.type}(),`;
        });
      }
  });

  return tokenReplacement;
}

export function generate(settings, cb) {
    appSettings = settings;
    workflow.emit('readValidatorTemplate', appSettings.models, cb);
};
