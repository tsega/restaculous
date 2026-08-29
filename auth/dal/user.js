// Load Modules
import bcrypt from "bcrypt";

// Configuration
import { SALT_LENGTH } from "../config/index.js";

// Get User model
import User from "../models/user.js";

/**
 * create a new user.
 *
 * @desc  creates a new user and saves it in the database
 *
 * @param {Object}   userData  Data for the User to create
 * @param {Function} cb     Callback for once saving is complete
 */
export function create(userData, cb) {
  console.log("creating a new User");

  // Hash Password
  bcrypt.hash(userData.password, SALT_LENGTH, (err, hash) => {
    if (err) {
      return cb(err);
    }
    // Create User
    userData.password = hash;

    User.create(userData)
      .then(user => cb(null, user))
      .catch(err => cb(err));
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
export function remove(query, cb) {
  console.log("deleting user: ", query);
  User.findOneAndDelete(query)
    .then(user => cb(null, user))
    .catch(err => cb(err));
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
export function update(query, updates, cb) {
  console.log("updating user: ", query);

  User.findOneAndUpdate(query, { $set: updates }, { new: true }) // option to return the new document
    .then(user => cb(null, user || {}))
    .catch(err => cb(err));
};

/**
 * get a User.
 *
 * @desc get a User with the given id from db
 *
 * @param {Object} query Query Object
 * @param {Function} cb Callback for once fetch is complete
 */
export function get(query, cb) {
  console.log("getting User ", query);

  User.findOne(query)
    .then(user => cb(null, user || {}))
    .catch(err => cb(err));
};

/**
 * search the collection of users
 *
 * @desc get a collection of users from db
 *
 * @param {Object} query Query Object
 * @param {Function} cb Callback for once fetch is complete
 */
export function search(options, cb) {
  console.log("Searching a collection of users");
  User.find(options.filter, options.fields)
    .sort(options.sort)
    .limit(options.limit)
    .skip(options.limit * (options.page - 1))
    .then(users => cb(null, users))
    .catch(err => cb(err));
};

/**
 * total The total number of documents in the collection.
 *
 * @desc get the total number of documents in the collection
 *
 * @param {Function} cb Callback for once fetch is complete
 */
export function count(filter, cb) {
  User.countDocuments(filter)
    .then(count => cb(null, count))
    .catch(err => cb(err));
};
