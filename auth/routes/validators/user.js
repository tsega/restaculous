// Load Module Dependencies
import { body, param, header } from "express-validator";

/**
 * GET Token Validation.
 *
 * @desc  A array of validation rules to apply on GET by Token
 */
export const getTokenValidator = [
  header("Authorization", "Authorization Token is required").isString()
];

/**
 * GET Validation.
 *
 * @desc  A array of validation rules to apply on GET
 */
export const getValidator = [param("userId", "User ID is required").isMongoId()];

/**
 * POST Validation.
 *
 * @desc  A array of validation rules to apply on POST
 */
export const postValidator = [
  body("email", "Email is required.").isString(),
  body("email", "Email must be valid.").isEmail(),
  body("password", "Password is required.").isString()
];

/**
 * PUT Validation.
 *
 * @desc  A array of validation rules to apply on PUT
 */
export const putValidator = [param("userId", "User ID is required").isMongoId()];

/**
 * DELETE Validation.
 *
 * @desc  A array of validation rules to apply on DELETE
 */
export const deleteValidator = [param("userId", "User ID is required").isMongoId()];
