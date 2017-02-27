// Load Module Dependencies
var events = require('events');
var moment = require('moment');
var debug = require('debug')('gebeya-api');

var config = require('../config');
var UserDal = require('../dal/user');
var TokenDal = require('../dal/token');

var crypto = require('crypto');

// Login Controller
// 1. Validate Data
// 2. Validate Username
// 3. Validate Password
// 4. Generate Token
exports.login = function login(req, res, next) {
    var workflow = new events.EventEmitter();

    workflow.on('validateData', function validateData() {
        req.checkBody('username', 'Username is Invalid!')
            .notEmpty();
        req.checkBody('password', 'Password is Invalid!')
            .notEmpty();

        var errs = req.validationErrors();
        if (errs) {
            res.status(400);
            res.json(errs);
            return;
        }

        workflow.emit('validateUsername');
    });

    workflow.on('validateUsername', function validateUsername() {
        // Check username
        UserDal.get({username: req.body.username}, function done(err, user) {
            if (err) {
                return next(err);
            }

            if (!user._id) {
                res.status(404);
                res.json({
                    message: 'Wrong Credentials!'
                });

                return;
            }

            workflow.emit('validatePassword', user);
        });
    });

    workflow.on('validatePassword', function validatePassword(user) {
        // CheckPassword
        user.checkPassword(req.body.password, function done(err, isOk) {
            if (err) {
                return next(err);
            }

            if (!isOk) {
                res.status(403);
                res.json({
                    message: 'Wrong Credentials'
                });
            }

            workflow.emit('generateToken', user);
        });
    });

    workflow.on('generateToken', function generateToken(user) {
        TokenDal.get({user: user._id}, function done(err, token) {
            if (err) {
                return next(err);
            }

            crypto.randomBytes(config.TOKEN_LENGTH, function genToken(err, buf) {
                if (err) {
                    return next(err);
                }

                var tokenValue = buf.toString('base64');

                if (!token._id) {
                    // Generate New Token
                    TokenDal.create({
                        user: user._id,
                        value: tokenValue,
                        revoked: false
                    }, function createToken(err, newToken) {
                        if (err) {
                            return next(err);
                        }

                        workflow.emit('respond', user, token);
                    });
                } else {
                    // Update value
                    TokenDal.update({_id: token._id}, {value: tokenValue, revoked: false}, function (err, newToken) {
                        if (err) {
                            return next(err);
                        }

                        workflow.emit('respond', user, tokenValue);
                    });
                }
            });


        });
    });

    workflow.on('respond', function respond(user, newToken) {
        var now = moment().toISOString();

        UserDal.update({_id: user._id}, {last_login: now}, function updateLogin(err, user) {
            if (err) {
                return next(err);
            }

            user = user.toJSON();
            delete user.password;

            res.json({
                token: newToken,
                user: user
            });
        });
    });

    workflow.emit('validateData');
};

// Logout Controller
// 1. Validate Data
// 2. Validate Token
// 3. Invalidate Token
exports.logout = function logout(req, res, next) {
    var workflow = new events.EventEmitter();

    workflow.on('validateData', function validateData() {
        req.checkBody('token', 'Token not provided!')
            .notEmpty();

        var errs = req.validationErrors();
        if (errs) {
            res.status(400);
            res.json(errs);
            return;
        }

        workflow.emit('validateToken');
    });

    workflow.on('validateToken', function validateToken() {
        // Check token
        TokenDal.get({value: req.body.token}, function done(err, token) {
            if (err) {
                return next(err);
            }

            if (!token._id) {
                res.status(404);
                res.json({
                    message: 'Invalid Token!'
                });

                return;
            }

            workflow.emit('invalidateToken', token);
        });
    });

    workflow.on('invalidateToken', function invalidateToken(token) {
        var now = moment().toISOString();
        // Update token
        TokenDal.update({_id: token._id}, {revoked: true, last_modified: now}, function done(err, token) {
            if (err) {
                return next(err);
            }

            if (!token._id) {
                res.status(404);
                res.json({
                    message: 'Unable to logout!'
                });

                return;
            }

            workflow.emit('respond');
        });
    });

    workflow.on('respond', function respond() {
        res.json({
            message: "User Successfully logged out!"
        });
    });

    workflow.emit('validateData');
};