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
 *  Format code base using Prettier Flow
 *
 *  Run prettier
 */
const workflow = new events.EventEmitter();
let appSettings = {};

/*
 *  runPrettier
 *
 *  Fix any code formatting issues by running prettier.
 *
 *  @param {workflowCallback} cb - The callback to handle end of the formatting process.
 */
workflow.on("runPrettier", function (cb) {
  exec(`cd ${appSettings.directory} && npm run prettier`, function(err, stdout, stderr) {
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

export function runFormatter(settings, cb) {
  appSettings = settings;
  workflow.emit("runPrettier", cb);
};
