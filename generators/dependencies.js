import events from "node:events";

import { runCommand } from "../cli/run-command.js";

const workflow = new events.EventEmitter();
let appSettings = {};

workflow.on("installDependencies", function installDependencies(cb) {
  runCommand("npm", ["install"], { cwd: appSettings.directory }, cb);
});

export const generate = function generateDependencies(settings, cb) {
    appSettings = settings;
    workflow.emit('installDependencies', cb);
};
