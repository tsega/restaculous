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
 *  Route Generator Flow
 *
 *  1. Read route template
 *  2. Replace tokens in route template
 *  3. Create route file
 *  4. Iterate through steps 1-5 until all route files are generated
 */
var workflow = new events.EventEmitter();
var appSettings = {};


/*
 *  readRouteTemplate
 *
 *  Reads the `templates/route.js.template` file.
 *
 *  @param {Object[]} models - The models for which the files are to be generated
 *  @param {workflowCallback} cb - The callback to handle end of the models generation process.
 */
workflow.on('readRouteTemplate', function readRouteTemplate(models, cb) {
    var allModels = clone(models);

    // Make sure that all models have been generated
    if (allModels.length) {
        var currentModel = allModels.pop();

        fs.readFile(`${__dirname}/../templates/route.js.template`, opts, function rf(err, routeFile) {
            if (err) {
                // Error handling
                cb(err);
            }

            // Replace the file tokens
            workflow.emit('replaceRouteTokens', allModels, currentModel, routeFile, cb);
        });
    } else {
        // Move on to next step of the global flow
        cb(null);
    }
});

/*
 *  replaceRouteTokens
 *
 *  Replaces the tokens defined in the template with values for the model.
 *
 *  @param {Object[]} models - The models for which the files are to be generated
 *  @param {Object}  currentModel - The currently selected model for which the token replacement will be done.
 *  @param {string}  routeFile - The string version of the template file.
 *  @param {workflowCallback} cb - The callback to handle end of the models generation process.
 */
workflow.on('replaceRouteTokens', function replaceRouteTokens(models, currentModel, routeFile, cb) {
    var schemaEntries = [];

    // Model Name
    routeFile = routeFile.replace(/\{\{modelName\}\}/g, currentModel.name);

    // Model Name in lower case
    routeFile = routeFile.replace(/\{\{modelNameToLower\}\}/g, currentModel.name.toLowerCase());

    // Model Name plural
    routeFile = routeFile.replace(/\{\{modelNamePlural\}\}/g, pluralize(currentModel.name));

    // Model Name in lower case and plural
    routeFile = routeFile.replace(/\{\{modelNamePluralToLower\}\}/g, pluralize(currentModel.name.toLowerCase()));

    // 'Create' action documentation tokens
    routeFile = routeFile.replace(/\{\{modelCreateParams\}\}/g, createParamToken(currentModel));
    routeFile = routeFile.replace(/\{\{modelCreateParamsExample\}\}/g, createParamExampleToken(currentModel));
    routeFile = routeFile.replace(/\{\{modelCreateSuccess\}\}/g, createSuccessToken(currentModel));
    routeFile = routeFile.replace(/\{\{modelCreateSuccessExample\}\}/g, createSuccessExampleToken(currentModel));

    // 'Search' action documentation tokens
    routeFile = routeFile.replace(/\{\{modelSearchParams\}\}/g, searchParamToken(currentModel));
    routeFile = routeFile.replace(/\{\{modelSearchParamsExample\}\}/g, searchParamExampleToken(currentModel));
    routeFile = routeFile.replace(/\{\{modelSearchSuccess\}\}/g, searchSuccessToken(currentModel));
    routeFile = routeFile.replace(/\{\{modelSearchSuccessExample\}\}/g, searchSuccessExampleTokens(currentModel));


    // 'Get', 'Update', 'Delete' action documentation tokens
    routeFile = routeFile.replace(/\{\{modelSuccess\}\}/g, getSuccessToken(currentModel));
    routeFile = routeFile.replace(/\{\{modelSuccessExample\}\}/g, getSuccessExampleToken(currentModel));


    // 'Update' action documentation tokens
    routeFile = routeFile.replace(/\{\{modelUpdateParamsExample\}\}/g, updateParamExampleToken(currentModel));


    // Create the model file
    workflow.emit('createRouteFile', models, currentModel, routeFile, cb);
});

/*
 *  createRouteFile
 *
 *  Creates the actual route file on disk.
 *
 *  @param {Object[]} models - The models for which the files are to be generated
 *  @param {Object}  currentModel - The currently selected model for which the token replacement will be done.
 *  @param {string}  routeFile - The string version of the template file.
 *  @param {workflowCallback} cb - The callback to handle end of the models generation process.
 */
workflow.on('createRouteFile', function createRouteFile(models, currentModel, routeFile, cb) {

    fs.writeFile(getRouteFileName(currentModel.name), routeFile, opts, function rf(err, data) {
        if (err) {
            // Error handling
            cb(err);
        }

        // This is called to iterate through all models
        workflow.emit('readRouteTemplate', models, cb);
    });
});

/*  createParamToken
 *
 *  @desc constructs the 'create' action documentation param token replacement
 *
 *  @param {Object} model - the model for which param token replacements are generated
 *  @returns {String} the replacement string to put in documentation
 */
function createParamToken(model) {
    var tokenReplacement = " *";
    model.attributes.forEach(function (attribute) {
        if (!attribute.isAuto) {
            tokenReplacement += `
 * @apiParam {${attribute.type}}  ${attribute.name} ${attribute.desc}`;
        }
    });

    return tokenReplacement;
}

/*  createParamExampleToken
 *
 *  @desc constructs the 'create' action documentation param example token replacement
 *
 *  @param {Object} model - the model for which param example token replacements are generated
 *  @returns {String} the replacement string to put in documentation
 */
function createParamExampleToken(model) {
    var tokenReplacement = ` *
 * @apiParamExample {json} Request-Example:
 *   {`;

    model.attributes.forEach(function (attribute, index) {
        if (!attribute.isAuto) {
            tokenReplacement += `
 *     "${attribute.name}": "${attribute.example}"${index < model.attributes.length - 1 ? "," : ""}`;
        }
    });

    tokenReplacement += `
 *   }`;

    return tokenReplacement;
}

/*  createSuccessToken
 *
 *  @desc constructs the 'create' action documentation success token replacement
 *
 *  @param {Object} model - the model for which success token replacements are generated
 *  @returns {String} the replacement string to put in documentation
 */
function createSuccessToken(model) {
    var tokenReplacement = ` *
 * @apiSuccess {String} _id  The ID of the newly created  ${model.name.toLowerCase()}.`;
    model.attributes.forEach(function (attribute, index) {
        if (!attribute.isPrivate) {
            tokenReplacement += `
 * @apiSuccess {${attribute.type}} ${attribute.name} ${attribute.desc}${index < model.attributes.length - 1 ? "," : ""}`;
        }
    });

    return tokenReplacement;
}

/*  createSuccessExampleToken
 *
 *  @desc constructs the 'create' action documentation success example token replacement
 *
 *  @param {Object} model - the model for which success example token replacements are generated
 *  @returns {String} the replacement string to put in documentation
 */
function createSuccessExampleToken(model) {
    var tokenReplacement = ` *
 * @apiSuccessExample {json} Success-Response:
 *   HTTP/1.1 201 Created
 *   {
 *     "_id": "58a1ea8b36dfb71d975384af",`;
    model.attributes.forEach(function (attribute, index) {
        if (!attribute.isPrivate) {
            tokenReplacement += `
 *     "${attribute.name}": "${attribute.example}"${index < model.attributes.length - 1 ? "," : ""}`;
        }
    });
    tokenReplacement += `
 *   }`;

    return tokenReplacement;
}

/*  searchParamToken
 *
 *  @desc constructs the 'search' action documentation param token replacement
 *
 *  @param {Object} model - the model for which param token replacements are generated
 *  @returns {String} the replacement string to put in documentation
 */
function searchParamToken(model) {
    var tokenReplacement = ` *
 * @apiParam {String} [filter]   The filtering to select the ${pluralize(model.name.toLowerCase())} to return.
 * @apiParam {String} [fields]   The fields of the ${model.name} document to return.
 * @apiParam {String} [limit]    The maximum number of ${pluralize(model.name.toLowerCase())} to return.
 * @apiParam {String} [page]     The page number used to determine how many documents to skip.
 * @apiParam {String} [sort]     The sort field to use in ascending or descending order.`;

    return tokenReplacement;
}

/*  searchParamExampleToken
 *
 *  @desc constructs the 'search' action documentation param example token replacement
 *
 *  @param {Object} model - the model for which param example token replacements are generated
 *  @returns {String} the replacement string to put in documentation
 */
function searchParamExampleToken(model) {
    var tokenReplacement = ` *
 * @apiParamExample {json} Request-Example:",
 * {
 *   "filter": { "modifiedAt": "2017-02-13T17:19:08.404Z" },
 *   "limit": 50,
 *   "sort": "-createdAt",`;

    var fields = [];

    model.attributes.forEach(function (attribute) {
        fields.push(attribute.name);
    });

    tokenReplacement += `
 *   "fields": "${fields.join(",")}"
 * }`;

    return tokenReplacement;
}

/*  searchSuccessToken
 *
 *  @desc constructs the 'search' action documentation success token replacement
 *
 *  @param {Object} model - the model for which success token replacements are generated
 *  @returns {String} the replacement string to put in documentation
 */
function searchSuccessToken(model) {
    var tokenReplacement = ` *
 * @apiSuccess {Object} options  The query options used in the search the ${pluralize(model.name.toLowerCase())}.,
 * @apiSuccess {Object[]} ${pluralize(model.name.toLowerCase())} The resulting set of documents.`;

    return tokenReplacement;
}

/*  searchSuccessExampleToken
 *
 *  @desc constructs the 'search' action documentation success example token replacement
 *
 *  @param {Object} model - the model for which success example token replacements are generated
 *  @returns {String} the replacement string to put in documentation
 */
function searchSuccessExampleTokens(model) {
    var fields = [];

    model.attributes.forEach(function (attribute) {
        fields.push(attribute.name);
    });

    var tokenReplacement = ` *
 * @apiSuccessExample {json} Success-Response:
 *   HTTP/1.1 200 OK
 *   {
 *     "options": {
 *       "filter": { "modifiedAt": "2017-02-13T17:19:08.404Z"\" },
 *       "fields": "${fields.join(",")}",
 *       "limit": 50,
 *       "sort": "-createdAt",
 *     },
 *     "result": [{`;
    model.attributes.forEach(function (attribute) {
        if (!attribute.isPrivate) {
            tokenReplacement += `
 *       "${attribute.name}": "${attribute.example}"`;
        }
    });
    tokenReplacement += `
 *     }]
 *   }`;

    return tokenReplacement;
}

/*  getSuccessToken
 *
 *  @desc constructs the 'get' action documentation success token replacement
 *
 *  @param {Object} model - the model for which success token replacements are generated
 *  @returns {String} the replacement string to put in documentation
 */
function getSuccessToken(model) {
    var tokenReplacement = ` *
 * @apiSuccess {String} _id  The ID of the ${model.name.toLowerCase()}.`;
    model.attributes.forEach(function (attribute) {
        if (!attribute.isPrivate) {
            tokenReplacement += `
 * @apiSuccess {${attribute.type}} ${attribute.name} ${attribute.desc}`;
        }
    });

    return tokenReplacement;
}

/*  getSuccessExampleToken
 *
 *  @desc constructs the 'get' action documentation success example token replacement
 *
 *  @param {Object} model - the model for which success example token replacements are generated
 *  @returns {String} the replacement string to put in documentation
 */
function getSuccessExampleToken(model) {
    var tokenReplacement = ` *
 * @apiSuccessExample {json} Success-Response:
 *   HTTP/1.1 200 OK
 *   {
 *     "_id": "58a1ea8b36dfb71d975384af",`;
    model.attributes.forEach(function (attribute, index) {
        if (!attribute.isPrivate) {
            tokenReplacement += `
 *     "${attribute.name}": "${attribute.example}"${index < model.attributes.length - 1 ? "," : ""}`;
        }
    });
    tokenReplacement += `
 *   }`;

    return tokenReplacement;
}

/*  updateParamExampleToken
 *
 *  @desc constructs the 'update' action documentation param example token replacement
 *
 *  @param {Object} model - the model for which param example token replacements are generated
 *  @returns {String} the replacement string to put in documentation
 */
function updateParamExampleToken(model) {
    var tokenReplacement = ` *
 * @apiParamExample {json} Request-Example:
 * {
 *   "_id": "58a1ea8b36dfb71d975384af",
 *   "document": {`;

    model.attributes.forEach(function (attribute, index) {
        tokenReplacement += `
 *      "${attribute.name}": "${attribute.example}"${index < model.attributes.length - 1 ? "," : ""}`;
    });

    tokenReplacement += `
 *   }
 * }`;

    return tokenReplacement;
}

/*
 *  getRouteFileName
 *
 *  @desc Get the full path of where the route file should be created.
 *
 *  @param {String} modelName - the name of the model.
 *  @returns {String} the full path of the route file.
 */
function getRouteFileName(modelName){
    return `${appSettings.directory}/routes/${modelName.toLowerCase()}.js` ;
}

exports.generate = function generateRoutes(settings, cb) {
    appSettings = settings;
    workflow.emit('readRouteTemplate', appSettings.models, cb);
};
