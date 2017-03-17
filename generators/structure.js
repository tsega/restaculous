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
 *  Structure Generator Flow
 *
 *  1. Copy structure folder to settings specified location
 */
var workflow = new events.EventEmitter();

/*
 *  copyStructure
 *
 *  @desc Copies the base structure of the application to location.
 *
 *  @param {String} directory - The location of the new application
 *  @param {workflowCallback} cb - The callback to handle end of the copying process.
 */
workflow.on('copyStructure', function copyStructure(settings, cb) {
    fs.copy('./structure', settings.directory, function done(err) {
        if (err) {
            // Error handling
            cb(err);
        }

        cb(null);
    });
});

exports.generate = function generateStructure(settings, cb) {
    workflow.emit('copyStructure', settings, cb);
};


