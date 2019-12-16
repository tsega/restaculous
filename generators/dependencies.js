/*
 *  Load module dependencies
 */
var events = require('events');
var { exec } = require('child_process');

/*
 *  Set file options
 */
var opts = {
  encoding: 'utf8'
};

/*
 *  Dependencies Installer Flow
 *
 *  Install dependencies
 */
var workflow = new events.EventEmitter();
var appSettings = {};

/*
 *  installDependencies
 *
 *  Install dependencies by running `npm install` in app directory.
 *
 *  @param {workflowCallback} cb - The callback to handle end of the install process.
 */
workflow.on('installDependencies', function installDependencies(cb) {
    exec(`cd ${appSettings.directory} && npm install`, function (err){
        if (err) {
          // Error handling
          cb(err);
        }

        // Finish base generator workflow
        cb(null);
    });
});

exports.generate = function generateConfig(settings, cb) {
    appSettings = settings;
    workflow.emit('installDependencies', cb);
};


