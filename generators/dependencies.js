import events from 'events';
import { exec } from 'child_process';

const opts = {
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 10 // 10MB
};

const workflow = new events.EventEmitter();
let appSettings = {};

workflow.on('installDependencies', function installDependencies(cb) {
    exec(`cd ${appSettings.directory} && npm install`, opts, function done(err, stdout, stderr) {
        if (err) {
            return cb(err);
        }
        cb(null, stdout);
    });
});

export const generate = function generateDependencies(settings, cb) {
    appSettings = settings;
    workflow.emit('installDependencies', cb);
};
