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
 *  Auth Generator Flow
 *
 *  1. Copy structure auth folder into the generated structure
 */
const workflow = new events.EventEmitter();

/*
 *  copyAuth
 *
 *  @desc Copies the Auth structure of the application to location.
 *
 *  @param {String} directory - The location of the new application
 *  @param {workflowCallback} cb - The callback to handle end of the copying process.
 */
workflow.on('copyAuth', function copyAuth(settings, cb) {
    fs.copy(__dirname + '/../auth/', settings.directory, function done(err) {
        if (err) {
            // Error handling
            return cb(err);
        }

        cb(null);
    });
});

export const generate = function generateAuth(settings, cb) {
    workflow.emit('copyAuth', settings, cb);
};
