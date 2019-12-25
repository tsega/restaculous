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
 *  Format code base using Prettier Flow
 *
 *  Run prettier
 */
var workflow = new events.EventEmitter();
var appSettings = {};

/*
 *  runPrettier
 *
 *  Fix any code formatting issues by running prettier.
 *
 *  @param {workflowCallback} cb - The callback to handle end of the install process.
 */
workflow.on("runPrettier", function runPrettier(cb) {
  exec(`cd ${appSettings.directory} && npm run prettier`, function(err) {
    if (err) {
      // Error handling
      cb(err);
    }

    // Finish base generator workflow
    cb(null);
  });
});

exports.runFormatter = function (settings, cb) {
  appSettings = settings;
  workflow.emit("runPrettier", cb);
};
