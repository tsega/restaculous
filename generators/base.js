/*
 *  Load module dependencies
 */
var events = require('events');
var fs = require('fs-extra');
var pluralize = require('pluralize');

/*
 *  Set file options
 */
var opts = {
    encoding: 'utf8'
};

/*
 *  Base Generator Flow
 *
 *  1. Read config template
 *  2. Replace tokens in config template
 *  3. Create config file
 *  4. Read router index template
 *  5. Replace tokens in router index template
 *  6. Create router index file
 *  7. Read package.json template
 *  8. Replace tokens in package.json template
 *  9. Create package.json file
 */
var workflow = new events.EventEmitter();
var appSettings = {};


/*
 *  readConfigTemplate
 *
 *  Reads the `templates/_config.js.template` file where the general structure of the configuration is defined.
 *
 *  @param {workflowCallback} cb - The callback to handle end of the generation process.
 */
workflow.on('readConfigTemplate', function readConfigTemplate(cb) {
    fs.readFile(__dirname + '/../templates/_config.js.template', opts, function rf(err, configFile) {
        if (err) {
            // Error handling
            cb(err);
        }

        // Replace the file tokens
        workflow.emit('replaceConfigTokens', configFile, cb);
    });
});

/*
 *  replaceConfigTokens
 *
 *  Replaces the tokens defined in the template with values for the config settings.
 *
 *  @param {string}  configFile - The string version of the template file.
 *  @param {workflowCallback} cb - The callback to handle end of the dals generation process.
 */
workflow.on('replaceConfigTokens', function replaceConfigTokens(configFile, cb) {
    var tokenReplacement = [];

    appSettings.config.forEach(function(config){
        tokenReplacement.push("\t\t // " + config.comment);
        tokenReplacement.push("\t\t" + config.name + ": " + config.value);
    });

    configFile = configFile.replace(/\{\{configSettings\}\}/g, tokenReplacement.join(",\n"));

    // Create the dal file
    workflow.emit('createConfigFile', configFile, cb);
});

/*
 *  createConfigFile
 *
 *  Creates the actual config file on disk.
 *
 *  @param {string}  configFile - The string version of the template file.
 *  @param {workflowCallback} cb - The callback to handle end of the dals generation process.
 */
workflow.on('createConfigFile', function createConfigFile(configFile, cb) {
    fs.writeFile(appSettings.directory + '/config/index.js', configFile, opts, function rf(err) {
        if (err) {
            // Error handling
            cb(err);
        }

        // Move to generating the routes/index.js file
        workflow.emit('readRouterTemplate', cb);
    });
});

/*
 *  readRouterTemplate
 *
 *  Reads the `templates/_router.js.template` file where the general structure of the router is defined.
 *
 *  @param {workflowCallback} cb - The callback to handle end of the generation process.
 */
workflow.on('readRouterTemplate', function readRouterTemplate(cb) {
    fs.readFile(__dirname + '/../templates/_router.js.template', opts, function rf(err, routerFile) {
        if (err) {
            // Error handling
            cb(err);
        }

        // Replace the file tokens
        workflow.emit('replaceRouterTokens', routerFile, cb);
    });
});

/*
 *  replaceRouterTokens
 *
 *  Replaces the tokens defined in the template with values for the router.
 *
 *  @param {string}  routerFile - The string version of the template file.
 *  @param {workflowCallback} cb - The callback to handle end of the dals generation process.
 */
workflow.on('replaceRouterTokens', function replaceRouterTokens(routerFile, cb) {
    var requireTokens = [];
    var initializeTokens = [];

    appSettings.models.forEach(function(model){
        requireTokens.push("var " + model.name.toLowerCase() + "Router = require('./" + model.name.toLowerCase() + "');");
        initializeTokens.push("\t // " + model.name + " Endpoint");
        initializeTokens.push("\t app.use('/"+ pluralize(model.name.toLowerCase()) +"', "+ model.name.toLowerCase() +"Router);\n");
    });

    routerFile = routerFile.replace(/\{\{requireRoutes\}\}/g, requireTokens.join("\n"));
    routerFile = routerFile.replace(/\{\{initializeRoutes\}\}/g, initializeTokens.join("\n"));

    // Create the dal file
    workflow.emit('createRouterFile',routerFile, cb);
});

/*
 *  createRouterFile
 *
 *  Creates the actual router file on disk.
 *
 *  @param {string}  routerFile - The string version of the template file.
 *  @param {workflowCallback} cb - The callback to handle end of the generation process.
 */
workflow.on('createRouterFile', function createRouterFile(routerFile, cb) {
    fs.writeFile(appSettings.directory + '/routes/index.js', routerFile, opts, function rf(err) {
        if (err) {
            // Error handling
            cb(err);
        }

        // Move to generating the package.json file
        workflow.emit('readPackageTemplate', cb);
    });
});

/*
 *  readPackageTemplate
 *
 *  Reads the `templates/_package.js.template` file where the general structure of the package is defined.
 *
 *  @param {workflowCallback} cb - The callback to handle end of the generation process.
 */
workflow.on('readPackageTemplate', function readPackageTemplate(cb) {
    fs.readFile(__dirname + '/../templates/_package.json.template', opts, function rf(err, packageFile) {
        if (err) {
            // Error handling
            cb(err);
        }

        // Replace the file tokens
        workflow.emit('replacePackageTokens', packageFile, cb);
    });
});

/*
 *  replacePackageTokens
 *
 *  Replaces the tokens defined in the template with values for the package.
 *
 *  @param {string}  packageFile - The string version of the template file.
 *  @param {workflowCallback} cb - The callback to handle end of the dals generation process.
 */
workflow.on('replacePackageTokens', function replacePackageTokens(packageFile, cb) {
    var appName = appSettings.name.toLowerCase().replace(" ", "-");
    var appDescription = appSettings.description;

    packageFile = packageFile.replace(/\{\{appName\}\}/g, appName);
    packageFile = packageFile.replace(/\{\{appDescription\}\}/g, appDescription);
    packageFile = packageFile.replace(/\{\{repositoryType\}\}/g, appSettings.repository.type);
    packageFile = packageFile.replace(/\{\{repositoryAddress\}\}/g, appSettings.repository.url);

    // Create the dal file
    workflow.emit('createPackageFile',packageFile, cb);
});

/*
 *  createPackageFile
 *
 *  Creates the actual package file on disk.
 *
 *  @param {string}  packageFile - The string version of the template file.
 *  @param {workflowCallback} cb - The callback to handle end of the generation process.
 */
workflow.on('createPackageFile', function createPackageFile(packageFile, cb) {
    fs.writeFile(appSettings.directory + '/package.json', packageFile, opts, function rf(err) {
        if (err) {
            // Error handling
            cb(err);
        }

        // Finish base generator workflow
        cb(null)
    });
});

exports.generate = function generateConfig(settings, cb) {
    appSettings = settings;
    workflow.emit('readConfigTemplate', cb);
};


