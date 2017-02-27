// Load Module Dependencies
var events = require('events');
var debug = require('debug')('gebeya-api');
var moment = require('moment');

var config = require('../config');
var UserDal = require('../dal/user');
var ProfileDal = require('../dal/Profile');

/* no operation(noop) function */
exports.noop = function noop(req, res, next) {
    res.json({
        message: "To Implemented"
    });
};

/*
 * Create User
 *
 *  1. Validate Data
 *  2. Create User
 *  3. Create Profile
 *  4. Respond
 */
exports.createUser = function createUser(req, res, next) {
    var workflow = new events.EventEmitter();

    workflow.on('validateUser', function validateUser() {
        debug('Validating User');

        // Validate user data
        req.checkBody('password', 'Password Invalid!')
            .notEmpty().withMessage('Password is empty!')
            .isLength(5);

        req.checkBody('email', 'Email Invalid!')
            .notEmpty().withMessage('Email is empty!')
            .isEmail();

        req.checkBody('first_name', 'First Name is empty!')
            .notEmpty();

        req.checkBody('last_name', 'Last Name is empty!')
            .notEmpty();

        req.checkBody('user_type', 'User Type is empty!')
            .notEmpty();

        var validationErrors = req.validationErrors();

        if (validationErrors) {
            res.status(400);
            res.json(validationErrors);
        } else {
            // On Success emit create user event
            workflow.emit('createUser');
        }
    });

    workflow.on('createUser', function createUser() {
        debug('Creating User');

        UserDal.create({
            password: req.body.password,
            username: req.body.email,
            role: req.body.user_type,
            realm: req.body.realm ? body.realm : 'user'
        }, function callback(err, user) {
            if (err) {
                return next(err);
            }

            // On Success emit create profile event
            workflow.emit('createProfile', user);
        });
    });

    workflow.on('createProfile', function createProfile(user) {
        debug('Creating Profile');

        // On success emit create user type event
        ProfileDal.create({
            user: user._id,
            first_name: req.body.first_name,
            last_name: req.body.last_name
        }, function createProfileCb(err, profile) {
            if (err) {
                next(err);
            }

            UserDal.update({_id: user._id}, {profile: profile._id}, function updateUserCb(err, user) {
                if (err) {
                    return next(err);
                }

                workflow.emit('respond', user, profile);
            });
        });

    });

    workflow.on('respond', function respond(user) {
        debug('Responding with new User');

        user = user.toJSON();
        delete user.password;

        res.status(201);
        res.json(user);
    });

    workflow.emit('validateUser');
};

/*
 * Get User
 *
 * 1. Validate User _id
 * 2. Fetch User
 * 3. Respond
 */
exports.getUser = function getUser(req, res, next) {
    var workflow = new events.EventEmitter();

    workflow.on('validateUserId', function validateUserId() {
        debug('Validating User Id');

        req.checkParams('userId', 'User ID Invalid!')
            .notEmpty().withMessage('User ID is empty!');

        var validationErrors = req.validationErrors();

        if (validationErrors) {
            res.status(400);
            res.json(validationErrors);
        } else {
            // On Success emit create user event
            workflow.emit('getUser');
        }
    });

    workflow.on('getUser', function getUser() {
        debug('Getting User');

        UserDal.get({_id: req.params.userId}, function callback(err, user) {
            if (err) {
                return next(err);
            }

            // On Success emit create profile event
            workflow.emit('respond', user);
        });
    });

    workflow.on('respond', function respond(user) {
        debug('Responding with requested User');

        user = user._id ? user.toJSON() : user;
        delete user.password;

        res.status(201);
        res.json(user);
    });

    workflow.emit('validateUserId');
};

/*
 * Get Users
 *
 * 1. Set query filter
 * 2. Set query fields
 * 3. Set query options
 * 4. Fetch Users
 * 5. Respond
 */
exports.getUsers = function getUsers(req, res, next) {
    var workflow = new events.EventEmitter();
    var query = {};
    var fields = "username role status realm last_modified date_created last_login";
    var options = {
        limit: config.PAGE_SIZE,
        skip: 0,
        sort: "-date_created"
    };

    // Check if a filter query is set
    if(req.query.filter){
        req.query.filter.split(",").forEach(function(queryFilter){
            query[queryFilter.split(":")[0]] = queryFilter.split(":")[1];
        });
    }

    // Check if user fields are specified
    if(req.query.fields){
        fields = req.query.fields
    }

    // Check if a page size is set
    if(req.query.pageSize){
        options.limit = req.query.pageSize * 1;
    }

    // Check if a page is set
    if(req.query.page){
        options.skip = options.limit * req.query.page;
    }

    // Check if a sort is set
    if(req.query.sort){
        options.sort = req.query.page;
    }

    workflow.on('getUsers', function getPagedUsers() {
        debug('Getting Users');

        UserDal.getCollection(query, fields, options, function callback(err, users) {
            if (err) {
                return next(err);
            }

            // On Success emit create profile event
            workflow.emit('respond', users);
        });
    });

    workflow.on('respond', function respond(users) {
        debug('Responding with requested Users');

        res.status(201);
        res.json(users);
    });

    workflow.emit('getUsers');
};

/*
 * Update User
 *
 *  1. Validate Data
 *  2. Update User
 *  3. Respond
 */
exports.updateUser = function updateUser(req, res, next) {
    var workflow = new events.EventEmitter();

    workflow.on('validateUserData', function validateUserData() {
        debug('Validating User data');

        req.checkParams('userId', 'User Id is empty!')
            .notEmpty();

        req.checkBody('email', 'Email Invalid!')
            .optional()
            .isEmail();

        req.checkBody('user_type', 'User Type is empty!')
            .optional();

        var validationErrors = req.validationErrors();

        if (validationErrors) {
            res.status(400);
            res.json(validationErrors);
        } else {
            // On Success emit create user event
            workflow.emit('updateUser');
        }
    });

    workflow.on('updateUser', function updateUser() {
        debug('Updating User');

        UserDal.update({_id: req.params.userId}, {
            username: req.body.email,
            role: req.body.user_type,
            realm: req.body.realm ? body.realm : 'user'
        }, function callback(err, user) {
            if (err) {
                return next(err);
            }

            // On Success emit create profile event
            workflow.emit('respond', user);
        });
    });

    workflow.on('respond', function respond(user) {
        debug('Responding with updated User');

        user = user.toJSON();
        delete user.password;

        res.status(200);
        res.json(user);
    });

    workflow.emit('validateUserData');
};

/*
 * Remove user including related model (Profile)
 *
 *  1. Validate Data
 *  2. Remove User
 *  3. Remove Profile
 *  3. Respond
 */
exports.removeUser = function removeUser(req, res, next) {
    var workflow = new events.EventEmitter();

    workflow.on('validateUserData', function validateUserData() {
        debug('Validating User data');

        req.checkParams('userId', 'User Id is empty!')
            .notEmpty();

        var validationErrors = req.validationErrors();

        if (validationErrors) {
            res.status(400);
            res.json(validationErrors);
        } else {
            // On Success emit create user event
            workflow.emit('removeUser');
        }
    });

    workflow.on('removeUser', function updateUser() {
        debug('Removing User');

        UserDal.delete({_id: req.params.userId}, function callback(err, user) {
            if (err) {
                return next(err);
            }

            // On Success emit create profile event
            workflow.emit('removeProfile', user);
        });
    });

    workflow.on('removeProfile', function updateUser(user) {
        debug('Removing Profile');

        ProfileDal.delete({user: req.params.userId}, function callback(err, profile) {
            if (err) {
                return next(err);
            }

            // On Success emit create profile event
            workflow.emit('respond', user, profile);
        });
    });

    workflow.on('respond', function respond(user, profile) {
        debug('Responding with removed User');

        user = user.toJSON();
        delete user.password;

        res.status(200);
        res.json({user: user, profile: profile});
    });

    workflow.emit('validateUserData');
};

