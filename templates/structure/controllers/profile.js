// Load Module Dependencies
var events = require('events');
var debug = require('debug')('gebeya-api');
var moment = require('moment');

var config = require('../config');
var ProfileDal = require('../dal/Profile');

/* no operation(noop) function */
exports.noop = function noop(req, res, next){
    res.json({
        message: "To Implemented"
    });
};

/*
 * Get Profile
 *
 * 1. Validate Profile _id
 * 2. Fetch Profile
 * 3. Respond
 */
exports.getProfile = function getProfile(req, res, next) {
    var workflow = new events.EventEmitter();

    workflow.on('validateProfileId', function validateProfileId() {
        debug('Validating Profile Id');

        req.checkParams('profileId', 'Profile ID Invalid!')
            .notEmpty().withMessage('Profile ID is empty!');

        var validationErrors = req.validationErrors();

        if (validationErrors) {
            res.status(400);
            res.json(validationErrors);
        } else {
            // On Success emit create profile event
            workflow.emit('getProfile');
        }
    });

    workflow.on('getProfile', function getProfile() {
        debug('Getting Profile');

        ProfileDal.get({_id: req.params.profileId}, function callback(err, profile) {
            if (err) {
                return next(err);
            }

            // On Success emit create profile event
            workflow.emit('respond', profile);
        });
    });

    workflow.on('respond', function respond(profile) {
        debug('Responding with requested Profile');

        res.status(200);
        res.json(profile);
    });

    workflow.emit('validateProfileId');
};

/*
 * Update Profile
 *
 *  1. Validate Data
 *  2. Update Profile
 *  3. Respond
 */
exports.updateProfile = function updateProfile(req, res, next) {
    var workflow = new events.EventEmitter();

    workflow.on('validateProfileData', function validateProfileData() {
        debug('Validating Profile data');

        req.checkBody('first_name', 'First Name is invalid!')
            .optional();

        req.checkBody('last_name', 'Last Name is invalid!')
            .optional();


        var validationErrors = req.validationErrors();

        if (validationErrors) {
            res.status(400);
            res.json(validationErrors);
        } else {
            // On Success emit update event
            workflow.emit('updateProfile');
        }
    });

    workflow.on('updateProfile', function updateProfile() {
        debug('Updating Profile');

        ProfileDal.update({_id: req.params.profileId}, {
            first_name: req.body.first_name,
            last_name: req.body.last_name
        }, function callback(err, profile) {
            if (err) {
                return next(err);
            }

            // On Success emit respond event
            workflow.emit('respond', profile);
        });
    });

    workflow.on('respond', function respond(profile) {
        debug('Responding with updated Profile');

        profile = profile.toJSON();
        delete profile.password;

        res.status(200);
        res.json(profile);
    });

    workflow.emit('validateProfileData');
};