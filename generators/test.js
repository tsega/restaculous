/*
 *  Load module dependencies
 */
import events from 'events';
import fs from 'fs-extra';
import clone from 'clone';
import pluralize from 'pluralize';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { getInvalidValidationValue } from '../cli/field-validation.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/*
 *  Set file options
 */
const opts = {
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
const workflow = new events.EventEmitter();
let appSettings = {};


/*
 *  readTestTemplate
 *
 *  Reads the `templates/test.js.template` file.
 *
 *  @param {Object[]} models - The models for which the files are to be generated
 *  @param {workflowCallback} cb - The callback to handle end of the models generation process.
 */
workflow.on('readTestTemplate', function readTestTemplate(models, cb) {
    let allModels = clone(models);

    // Make sure that all models have been generated
    if (allModels.length) {
        let currentModel = allModels.pop();

        fs.readFile(__dirname + '/../templates/test.js.template', opts, function rf(err, testFile) {
            if (err) {
                // Error handling
                return cb(err);
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
    testFile = testFile.replace(/\{\{authToken\}\}/g, appSettings.authentication
        ? '`Bearer ${jwt.sign({ sub: "test-user" }, JWT_KEY)}`'
        : '""');
    testFile = testFile.replace(/\{\{validationTests\}\}/g, validationTests(currentModel));
    testFile = testFile.replace(
        /\{\{optionalValidationTest\}\}/g,
        optionalValidationTest(currentModel)
    );

    const routes = currentModel.routes ?? ["post", "get", "search", "put", "delete"];
    for (const action of ["post", "get", "search", "put", "delete"]) {
        const section = new RegExp(`\\{\\{#${action}\\}\\}([\\s\\S]*?)\\{\\{/${action}\\}\\}`, "g");
        testFile = testFile.replace(section, routes.includes(action) ? "$1" : "");
    }

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
            return cb(err);
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
    let tokenReplacement = [];

    model.attributes.forEach(function (attribute) {
        tokenReplacement.push(`  ${JSON.stringify(attribute.name)}: ${JSON.stringify(attribute.example)}`);
    });

    return tokenReplacement.join(",\n") ;
}

function validationTests(model) {
    const route = pluralize(model.name.toLowerCase());
    const tests = [];

    model.attributes.forEach(function (attribute) {
        attribute.validation.forEach(function (validation) {
            const invalidValue = JSON.stringify(getInvalidValidationValue(validation));
            tests.push(`
  it("rejects invalid ${attribute.name} values for ${validation.type}", async () => {
    await request(app)
      .post("/${route}")
      .set("Authorization", authorization)
      .send({ ...sampleDocument, ${JSON.stringify(attribute.name)}: ${invalidValue} })
      .expect(422);
  });`);
        });
    });

    return tests.join("\n");
}

function optionalValidationTest(model) {
    const hasValidation = model.attributes.some(
        (attribute) => attribute.validation.length > 0
    );
    if (!hasValidation) {
        return "";
    }

    return `
  it("allows validated fields to be omitted when updating", async () => {
    const existing = await ${model.name}.create(sampleDocument);

    await request(app)
      .put(\`/${pluralize(model.name.toLowerCase())}/\${existing.id}\`)
      .set("Authorization", authorization)
      .send({})
      .expect(200);
  });`;
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
    return appSettings.directory + "/test/" + modelName.toLowerCase() + '.test.js' ;
}

export function generate(settings, cb) {
    appSettings = settings;
    workflow.emit('readTestTemplate', settings.models, cb);
};
