// Load Module Dependencies
var { body } = require("express-validator");

/**
 * POST Validation.
 *
 * @desc  A array of validation rules to apply on POST
 */
exports.postValidator = [
  body("email", "Email is required.").isString(),
  body("email", "Email must be valid.").isEmail(),
  body("password", "Password is required.").isString()
];
