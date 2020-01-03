// Load Module Dependencies
var events = require("events");
var bcrypt = require("bcrypt");
var jwt = require("jsonwebtoken");
var { validationResult } =  require('express-validator');

// Get User DAL
var UserDal = require("../dal/user");

// Get Config file
var { JWT_KEY } = require("../config");

/*
 * Create User
 *
 *  1. Create User
 *  2. Respond
 */
exports.createUser = function createUser(req, res, next) {
  let workflow = new events.EventEmitter();

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
  let workflow = new events.EventEmitter();

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
        userId: user._id
      },
      JWT_KEY,
      {
        expiresIn: "1h"
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
