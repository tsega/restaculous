/*
 *  Load module dependencies
 */
import events from 'events';
import fs from 'fs-extra';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/*
 *  Set file options
 */
const opts = {
    encoding: 'utf8'
};

/*
 *  Structure Generator Flow
 *
 *  1. Copy structure folder to settings specified location
 */
const workflow = new events.EventEmitter();

/*
 *  copyStructure
 *
 *  @desc Copies the base structure of the application to location.
 *
 *  @param {String} directory - The location of the new application
 *  @param {workflowCallback} cb - The callback to handle end of the copying process.
 */
workflow.on('copyStructure', function copyStructure(settings, cb) {
    fs.copy(__dirname + '/../structure', settings.directory, function done(err) {
        if (err) {
            // Error handling
            return cb(err);
        }

        cb(null);
    });
});

export function generate(settings, cb) {
    workflow.emit('copyStructure', settings, cb);
};
