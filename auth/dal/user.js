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
 * remove a user
 *
 * @desc  delete data of the user with the given id
 *
 * @param {Object}  query   Query Object
 * @param {Function} cb Callback for once delete is complete
 */
exports.remove = function remove(query, cb) {
  console.log("deleting user: ", query);
  User.findOneAndRemove(query, function deleteUser(err, user) {
    if (err) {
      return cb(err);
    }

    cb(null, user);
  });
};

/**
 * update a user
 *
 * @desc  update data of the user with the given id
 *
 * @param {Object} query Query object
 * @param {Object} updates  Update data
 * @param {Function} cb Callback for once update is complete
 */
exports.update = function update(query, updates, cb) {
  console.log("updating user: ", query);

  User.findOneAndUpdate(query, { $set: updates }, { new: true }) // option to return the new document
    .exec(function updateUser(err, user) {
      if (err) {
        return cb(err);
      }

      cb(null, user || {});
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

/**
 * search the collection of users
 *
 * @desc get a collection of users from db
 *
 * @param {Object} query Query Object
 * @param {Function} cb Callback for once fetch is complete
 */
exports.search = function search(options, cb) {
  console.log("Searching a collection of users");
  User.find(options.filter, options.fields)
    .sort(options.sort)
    .limit(options.limit)
    .skip(options.limit * (options.page - 1))
    .exec(function searchUsers(err, users) {
      if (err) {
        return cb(err);
      }

      cb(null, users);
    });
};

/**
 * total The total number of documents in the collection.
 *
 * @desc get the total number of documents in the collection
 *
 * @param {Function} cb Callback for once fetch is complete
 */
exports.count = function count(filter, cb) {
  User.countDocuments(filter, function (err, count) {
      if (err) {
        return cb(err);
      }

      cb(null, count);
    });
};
