// Load Module Dependencies
var events = require("events");
var bcrypt = require("bcrypt");
var jwt = require("jsonwebtoken");
var { validationResult } = require("express-validator");

// Load Search Options library file
var searchOptions = require("../lib/search_options");

// Get User DAL
var UserDal = require("../dal/user");

// Default fields to return on search if not provided
var defaultFields = ["email"];

// Get Config file
var { JWT_KEY } = require("../config");

/*
 * Create User
 *
 *  1. Create User
 *  2. Respond
 */
exports.createUser = function createUser(req, res, next) {
  const workflow = new events.EventEmitter();

  workflow.on("validateData", function validateData() {
    // Validate User data
    var errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    // On Success emit create User event
    workflow.emit("createUser");
  });

  workflow.on("createUser", function createUser() {
    UserDal.create(req.body, function callback(err, user) {
      if (err) {
        return next(err);
      }

      // On Success respond with new user
      workflow.emit("respond", user);
    });
  });

  workflow.on("respond", function respond(user) {
    res.status(201);
    res.json(user);
  });

  workflow.emit("validateData");
};

/*
 * Login User
 *
 *  1. Find User by email
 *  2. Check User password match
 *  3. Respond
 */
exports.loginUser = function loginUser(req, res, next) {
  const workflow = new events.EventEmitter();

  workflow.on("validateData", function validateData() {
    // Validate User data
    var errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    // On Success emit create User event
    workflow.emit("checkUser");
  });

  workflow.on("checkUser", function checkUser() {
    UserDal.get({ email: req.body.email }, function(err, user) {
      if (err) {
        return res.status(401).json({
          message: "Auth Failed"
        });
      }

      workflow.emit("checkPassword", user);
    });
  });

  workflow.on("checkPassword", function checkPassword(user) {
    bcrypt.compare(req.body.password, user.password, (err, result) => {
      if (err) {
        return res.status(401).json({
          message: "Auth Failed"
        });
      }

      if (result) {
        workflow.emit("respond", user);
      } else {
        return res.status(401).json({
          message: "Auth Failed"
        });
      }
    });
  });

  workflow.on("respond", function respond(user) {
    var token = jwt.sign(
      {
        email: user.email,
        _id: user._id
      },
      JWT_KEY,
      {
        expiresIn: "1d"
      }
    );
    res.status(200);
    res.json({
      message: "Auth Successful",
      token: token
    });
  });

  workflow.emit("checkUser");
};

/*
 * Logout User
 *
 *  1. Validate Token
 *  2. Invalidate JWT token
 *  3. Respond
 */
exports.logoutUser = function logoutUser(req, res, next) {
  var workflow = new events.EventEmitter();

  workflow.on("validateToken", function validateToken() {
    // Validate Token
    var errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    workflow.emit("respond");
  });

  workflow.on("respond", function respond() {
    res.status(200);
    res.json({
      message: "User successfully logged out.",
      token: null
    });
  });

  workflow.emit("validateToken");
};

/*
 * Get User
 *
 *  1. Validate User Id
 *  2. Fetch User form database
 *  3. Respond
 */
exports.getUser = function getUser(req, res, next) {
  var workflow = new events.EventEmitter();

  workflow.on("validateUserId", function validateUserId() {
    // Validate User ID
    var errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    // On Success emit fetch User event
    workflow.emit("fetchUser", req.params.userId);
  });

  workflow.on("fetchUser", function fetchUser(userId) {
    UserDal.get({ _id: userId }, function(err, user) {
      if (err) {
        // handle error
        return next(err);
      }

      workflow.emit("respond", user);
    });
  });

  workflow.on("respond", function respond(user) {
    res.status(200);
    res.json(user);
  });

  workflow.emit("validateUserId");
};

/*
 * Get User By Token
 *
 *  1. Validate Token
 *  2. Fetch User form database
 *  3. Respond
 */
exports.getUserByToken = function getUserByToken(req, res, next) {
  var workflow = new events.EventEmitter();

  workflow.on("validateToken", function validateToken() {
    // Validate Token
    var errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    var token = req.header("Authorization").split(" ")[1];

    jwt.verify(token, JWT_KEY, function(err, user) {
      if (err) {
        // handle error
        return next(err);
      }

      workflow.emit("respond", user);
    });
  });

  workflow.on("respond", function respond(user) {
    res.status(200);
    res.json({ user });
  });

  workflow.emit("validateToken");
};

/* Search Users
 *
 *  1. Validate Search Query
 *  2. Fetch Users form database
 *  3. Respond
 */
exports.searchUsers = function searchUsers(req, res, next) {
  var workflow = new events.EventEmitter();

  // Set default search parameter options
  req.query.filter = searchOptions.getFilter(req);
  req.query.fields = searchOptions.getFields(req, defaultFields);
  req.query.page = searchOptions.getPage(req);
  req.query.limit = searchOptions.getLimit(req);
  req.query.sort = searchOptions.getSort(req);

  workflow.on("searchUsers", function searchUsers() {
    var opts = {
      filter: req.query.filter,
      fields: req.query.fields,
      sort: req.query.sort,
      limit: req.query.limit,
      page: req.query.page
    };

    UserDal.search(opts, function(err, users) {
      if (err) {
        // handle error
        return next(err);
      }

      workflow.emit("getTotalCount", opts, users);
    });
  });

  workflow.on("getTotalCount", function getTotalCount(opts, users) {
    UserDal.count({}, function(err, total) {
      if (err) {
        // handle error
        return next(err);
      }

      opts.total = total;

      // Check if filter is an empty object, i.e. total filtered count is total count
      if (
        Object.keys(opts.filter).length === 0 &&
        opts.filter.constructor === Object
      ) {
        opts.totalFiltered = total;
        workflow.emit("respond", opts, users);
      } else {
        workflow.emit("getTotalFilteredCount", opts, users);
      }
    });
  });

  workflow.on("getTotalFilteredCount", function getTotalFilteredCount(opts, users) {
    UserDal.count(opts.filter, function(err, totalFiltered) {
      if (err) {
        // handle error
        return next(err);
      }

      opts.totalFiltered = totalFiltered;

      workflow.emit("respond", opts, users);
    });
  });

  workflow.on("respond", function respond(opts, users) {
    res.status(200);
    res.json({
      options: opts,
      result: users
    });
  });

  workflow.emit("searchUsers");
};

/*
 * Update User
 *
 *  1. Validate User Data
 *  2. Update User in database
 *  3. Respond
 */
exports.updateUser = function updateUser(req, res, next) {
  var workflow = new events.EventEmitter();

  workflow.on("validateUserData", function validateUserData() {
    // Validate User ID and update document
    var errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    // On Success emit update User event
    workflow.emit("updateUser");
  });

  workflow.on("updateUser", function updateUser() {
    UserDal.update({ _id: req.params.userId }, req.body, function(err, user) {
      if (err) {
        // handle error
        return next(err);
      }

      workflow.emit("respond", user);
    });
  });

  workflow.on("respond", function respond(user) {
    // TODO: Remove private fields
    res.status(200);
    res.json(user);
  });

  workflow.emit("validateUserData");
};

/*
 * Remove User
 *
 *  1. Validate User Id
 *  2. Remove User form database
 *  3. Respond
 */
exports.removeUser = function removeUser(req, res, next) {
  var workflow = new events.EventEmitter();

  workflow.on("validateUserId", function validateUserId() {
    // Validate User id
    var errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    // On Success emit remove User event
    workflow.emit("removeUser");
  });

  workflow.on("removeUser", function removeUser() {
    UserDal.remove({ _id: req.params.userId }, function(err, user) {
      if (err) {
        // handle error
        return next(err);
      }

      workflow.emit("respond", user);
    });
  });

  workflow.on("respond", function respond(user) {
    // TODO: Remove private fields
    res.status(200);
    res.json(user);
  });

  workflow.emit("validateUserId");
};

// no operation(noop) function
exports.noop = function noop(req, res, next) {
  res.json({
    message: "To Implemented"
  });
};
