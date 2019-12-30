var express = require('express');

// Get Users controller
var Users = require('../controllers/users');

// Get User validators
var { postValidator } = require("./validators/user");

// Create a router
var router = express.Router();

/**
 * @api {user} /users/  Create User
 * @apiName CreateUser
 * @apiGroup User
 * @apiVersion 0.0.1
 *
 * @apiParam {String} email The email of the User.
 * @apiParam {String} password The password of the User.
 *
 * @apiParamExample {json} Request-Example:
 * 	 {
 * 		"email": "john.doe@example.com",
 * 		"password": "plain-text-password",
 * 	 }
 *
 * @apiSuccess {String} _id  The ID of the newly created User.
 * @apiSuccess {String} email The email of the User.
 * @apiSuccess {String} password The hashed password of the User.
 * @apiSuccess {Date} createdAt The date on which the User entry was created.
 * @apiSuccess {Date} updatedAt The date on which the User entry was last updated.
 *
 * @apiSuccessExample {json} Success-Response:
 * 	 HTTP/1.1 201 Created
 * 	 {
 * 		 _id: '58a1ea8b36dfb71d975384af',
 * 		email: "john.doe@example.com",
 *    password: "$2a$10$N9qo8uLOickgx2..",
 * 		createdAt: 2017-02-13T17:19:08.404Z,
 * 		updatedAt: 2017-02-13T17:19:08.404Z,
 * 	 }
 *
 */
router.post('/', postValidator, Users.createUser);

/**
 * @api {user} /users/  Login User
 * @apiName LoginUser
 * @apiGroup User
 * @apiVersion 0.0.1
 *
 * @apiParam {String} email The email of the User.
 * @apiParam {String} password The password of the User.
 *
 * @apiParamExample {json} Request-Example:
 * {
 *  "email": "john.doe@example.com",
 *  "password": "plain-text-password",
 * }
 *
 * @apiSuccess {String} message  Message confirming success of Authentication.
 * @apiSuccess {String} token The JWT token for the logged in user.
 *
 * @apiSuccessExample {json} Success-Response:
 * HTTP/1.1 201 Created
 *  {
 *   "message": "Auth Successful",
 *   "token": "eyJhbGciOiJIUzI1NiIs.."
 *  }
 *
 */
router.post('/login', postValidator, Users.loginUser);

module.exports = router;