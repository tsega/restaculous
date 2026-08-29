import events from 'events';
import { exec } from 'child_process';

const opts = {
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 10 // 10MB
};

const workflow = new events.EventEmitter();
let appSettings = {};

workflow.on('generateDocs', function generateDocs(cb) {
    exec(`cd ${appSettings.directory} && npm run build-docs`, opts, function done(err, stdout, stderr) {
        if (err) {
            return cb(err);
        }
        cb(null, stdout);
    });
});

export const generate = function generateDocumentation(settings, cb) {
    appSettings = settings;
    workflow.emit('generateDocs', cb);
};
