/*
 *  Load module dependencies
 */
var events = require('events');
var fs = require('fs-extra');

/*
 *  Set file options
 */
var opts = {
    encoding: 'utf8'
};

/*
 *  Auth Generator Flow
 *
 *  1. Copy structure auth folder into the generated structure
 */
var workflow = new events.EventEmitter();

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
            cb(err);
        }

        cb(null);
    });
});

exports.generate = function generateAuth(settings, cb) {
    workflow.emit('copyAuth', settings, cb);
};
