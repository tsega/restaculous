// Load Module Dependencies
var mongoose = require('mongoose');
var bcrypt = require('bcrypt');
var moment = require('moment');
var debug = require('debug')('gebeya-api');

var config = require('../config');

// Define User attributes
var UserSchema = mongoose.Schema({
    username: {type: String},
    password: {type: String},
    realm: {type: String, default: 'user'},
    role: {type: String},
    status: {type: String, default: 'active'},
    last_login: {type: Date},
    date_created: {type: Date},
    last_modified: {type: Date}
});

// Add a pre save hook
UserSchema.pre('save', function preSaveHook(next) {
    var user = this;

    bcrypt.genSalt(config.SALT_LENGTH, function genSalt(err, salt) {
        if (err) {
            next(err);
        }

        bcrypt.hash(user.password, salt, function hashPassword(err, hash) {
            if (err) {
                return next(err);
            }

            var now = moment().toISOString();

            user.password = hash;
            user.date_created = now;
            user.last_modified = now;

            next();
        });
    });
});

// Compare Passwords Method
UserSchema.methods.checkPassword = function checkPassword(password, cb) {
    bcrypt.compare(password, this.password, function done(err, res) {
        if (err) {
            return cb(err);
        }

        cb(null, res);
    });
};

// Export User Model
module.exports = mongoose.model('User', UserSchema);