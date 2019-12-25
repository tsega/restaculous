/*
 *  Load module dependencies
 */
var events = require("events");
var { exec } = require("child_process");

/*
 *  Set file options
 */
var opts = {
  encoding: "utf8"
};

/*
 *  Documentation Generator Flow
 *
 *  Generate documentation
 */
var workflow = new events.EventEmitter();
var appSettings = {};

/*
 *  generateDocumentation
 *
 *  Generate the API documentation by running `npm run build-docs` in app directory.
 *
 *  @param {workflowCallback} cb - The callback to handle end of the install process.
 */
workflow.on("generateDocumentation", function generateDocumentation(cb) {
  exec(`cd ${appSettings.directory} && npm run build-docs`, function(err, stdout, stderr) {
    if (err) {
      console.log(stderr);
      // Error handling
      cb(err);
    }

    console.log(stdout);
    // Finish base generator workflow
    cb(null);
  });
});

exports.generate = function generateConfig(settings, cb) {
  appSettings = settings;
  workflow.emit("generateDocumentation", cb);
};
