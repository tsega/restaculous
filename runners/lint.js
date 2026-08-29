/*
 *  Load module dependencies
 */
import events from "node:events";

import { runCommand } from "../cli/run-command.js";

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
  runCommand(
    "npm",
    ["run", "eslint"],
    { cwd: appSettings.directory },
    function done(error, output) {
      if (error) {
        return cb(error);
      }

      console.log(output.stdout);
      // Finish base generator workflow
      cb(null);
    }
  );
});

export function runLinter(settings, cb) {
  appSettings = settings;
  workflow.emit("runEsLint", cb);
};
