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
 *  Lint code base using eslint
 *
 *  Run eslint
 */
var workflow = new events.EventEmitter();
var appSettings = {};

/*
 *  runEsLint
 *
 *  Fix any code issues by running eslint.
 *
 *  @param {workflowCallback} cb - The callback to handle end of the linting process.
 */
workflow.on("runEsLint", function (cb) {
  exec(`cd ${appSettings.directory} && npm run eslint`, function(err, stdout, stderr) {
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

exports.runLinter = function (settings, cb) {
  appSettings = settings;
  workflow.emit("runEsLint", cb);
};
