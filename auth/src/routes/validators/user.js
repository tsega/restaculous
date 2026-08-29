import { body, param } from "express-validator";

export const idValidator = [param("userId").isMongoId().withMessage("Invalid user ID")];
export const registerValidator = [
  body("email").isEmail().withMessage("A valid email is required"),
  body("password").isLength({ min: 8 }).withMessage("Password must contain at least 8 characters")
];
export const loginValidator = registerValidator;
export const updateValidator = [
  ...idValidator,
  body("email").optional().isEmail().withMessage("Email must be valid"),
  body("password").not().exists().withMessage("Password cannot be updated here")
];
