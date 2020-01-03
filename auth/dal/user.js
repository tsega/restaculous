// Load Modules
var bcrypt = require("bcrypt");

// Configuration
var { SALT_LENGTH } = require("../config");

// Get User model
var User = require("../models/user");

/**
 * create a new user.
 *
 * @desc  creates a new user and saves it in the database
 *
 * @param {Object}   userData  Data for the User to create
 * @param {Function} cb     Callback for once saving is complete
 */
exports.create = function create(userData, cb) {
  console.log("creating a new User");

  // Hash Password
  bcrypt.hash(userData.password, SALT_LENGTH, (err, hash) => {
    if (err) {
      return cb(err);
    }
    // Create User
    userData.password = hash;

    User.create(userData, function createUser(err, user) {
      if (err) {
        return cb(err);
      }

      // TODO: Remove private fields`
      cb(null, user);
    });
  });
};

/**
 * get a User.
 *
 * @desc get a User with the given id from db
 *
 * @param {Object} query Query Object
 * @param {Function} cb Callback for once fetch is complete
 */
exports.get = function get(query, cb) {
  console.log("getting User ", query);

  User.findOne(query).exec(function(err, user) {
    if (err) {
      return cb(err);
    }
    cb(null, user || {});
  });
};
