// Load Module Dependencies
var { body, param, header } = require("express-validator");

/**
 * GET Token Validation.
 *
 * @desc  A array of validation rules to apply on GET by Token
 */
exports.getTokenValidator = [
  header("Authorization", "Authorization Token is required").isString()
];

/**
 * GET Validation.
 *
 * @desc  A array of validation rules to apply on GET
 */
exports.getValidator = [param("userId", "User ID is required").isMongoId()];

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

/**
 * PUT Validation.
 *
 * @desc  A array of validation rules to apply on PUT
 */
exports.putValidator = [param("userId", "User ID is required").isMongoId()];

/**
 * DELETE Validation.
 *
 * @desc  A array of validation rules to apply on DELETE
 */
exports.deleteValidator = [param("userId", "User ID is required").isMongoId()];
