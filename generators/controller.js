import events from 'events';
import fs from 'fs-extra';
import clone from 'clone';
import pluralize from 'pluralize';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const opts = {
    encoding: 'utf8'
};

const workflow = new events.EventEmitter();
let appSettings = {};

workflow.on('readControllerTemplate', function readControllerTemplate(models, cb) {
    const allModels = clone(models);

    if (allModels.length) {
        const currentModel = allModels.pop();

        fs.readFile(__dirname + '/../templates/controller.js.template', opts, function rf(err, controllerFile) {
            if (err) {
                return cb(err);
            }

            workflow.emit('replaceControllerTokens', allModels, currentModel, controllerFile, cb);
        });
    } else {
        cb(null);
    }
});

workflow.on('replaceControllerTokens', function replaceControllerTokens(models, currentModel, controllerFile, cb) {
    controllerFile = controllerFile.replace(/\{\{modelName\}\}/g, currentModel.name);
    controllerFile = controllerFile.replace(/\{\{modelNameToLower\}\}/g, currentModel.name.toLowerCase());
    controllerFile = controllerFile.replace(/\{\{modelNamePlural\}\}/g, pluralize(currentModel.name));
    controllerFile = controllerFile.replace(/\{\{modelNamePluralToLower\}\}/g, pluralize(currentModel.name.toLowerCase()));
    controllerFile = controllerFile.replace(/\{\{modelDefaultFieldList\}\}/g, defaultFieldList(currentModel));

    workflow.emit('createControllerFile', models, currentModel, controllerFile, cb);
});

workflow.on('createControllerFile', function createControllerFile(models, currentModel, controllerFile, cb) {
    fs.writeFile(getControllerFileName(currentModel.name), controllerFile, opts, function rf(err) {
        if (err) {
            return cb(err);
        }

        workflow.emit('readControllerTemplate', models, cb);
    });
});

function getControllerFileName(modelName) {
    return appSettings.directory + '/controllers/' + modelName.toLowerCase() + '.js';
}

function defaultFieldList(model) {
    const tokenReplacement = [];

    model.attributes.forEach(function (attribute) {
        tokenReplacement.push("'" + attribute.name + "'");
    });

    return "[" + tokenReplacement.join(", ") + "]";
}

export const generate = function generateControllers(settings, cb) {
    appSettings = settings;
    workflow.emit('readControllerTemplate', appSettings.models, cb);
};
