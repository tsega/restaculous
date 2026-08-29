/*
 *  Load module dependencies
 */
import events from "events";
import { exec } from "child_process";

/*
 *  Set file options
 */
const opts = {
  encoding: "utf8",
  maxBuffer: 1024 * 1024 * 10 // 10MB
};

/*
 *  Lint code base using eslint
 *
 *  Run eslint
 */
const workflow = new events.EventEmitter();
let appSettings = {};

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
      return cb(err);
    }

    console.log(stdout);
    // Finish base generator workflow
    cb(null);
  });
});

export function runLinter(settings, cb) {
  appSettings = settings;
  workflow.emit("runEsLint", cb);
};
