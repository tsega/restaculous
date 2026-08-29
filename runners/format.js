/*
 *  Load module dependencies
 */
import events from "node:events";

import { runCommand } from "../cli/run-command.js";

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
  runCommand(
    "npm",
    ["run", "prettier"],
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

export function runFormatter(settings, cb) {
  appSettings = settings;
  workflow.emit("runPrettier", cb);
};
