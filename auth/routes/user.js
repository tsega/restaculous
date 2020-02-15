var express = require("express");

// Get Users controller
var Users = require("../controllers/users");

// Get User validators
var {
  getTokenValidator,
  getValidator,
  postValidator,
  putValidator,
  deleteValidator
} = require("./validators/user");

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
router.post("/", postValidator, Users.createUser);

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
router.post("/login", postValidator, Users.loginUser);

/**
 * @api {get} /users/search Search users
 * @apiName GetUsers
 * @apiGroup User
 * @apiVersion 0.0.1
 *
 *
 * @apiParam {String} [filter]   The filtering to select the users to return.
 * @apiParam {String} [fields]   The fields of the User document to return.
 * @apiParam {String} [limit]    The maximum number of users to return.
 * @apiParam {String} [page]     The page number used to determine how many documents to skip.
 * @apiParam {String} [sort]     The sort field to use in ascending or descending order.
 *
 *
 * @apiParamExample {json} Request-Example:",
 * {
 *   "filter": { "modifiedAt": "2017-02-13T17:19:08.404Z" },
 *   "limit": 50,
 *   "sort": "-createdAt",
 *   "fields": "email"
 * }
 *
 *
 * @apiSuccess {Object} options  The query options used in the search the users.,
 * @apiSuccess {Object[]} users The resulting set of documents.
 *
 *
 * @apiSuccessExample {json} Success-Response:
 *   HTTP/1.1 200 OK
 *   {
 *     "options": {
 *       "filter": { "modifiedAt": "2017-02-13T17:19:08.404Z"" },
 *       "fields": "email",
 *       "limit": 50,
 *       "sort": "-createdAt",
 *     },
 *     "result": [{
 *       "email": "john@example.com"
 *     }]
 *   }
 *
 */
router.get("/search", Users.searchUsers);

/**
 * @api {get} /users/ Get User by Token
 * @apiName GetUser
 * @apiGroup User
 * @apiVersion 0.0.1
 *
 * @apiHeader {String} authorization User token in bearer format.
 *
 * @apiHeaderExample {json} Header-Example:
 *     {
 *       "Authorization": "Bearer eyJraWQiOiJ1dURLVTMxZWRvTi0wd0x..."
 *     }
 *
 *
 * @apiSuccess {String} _id  The ID of the User.
 * @apiSuccess {String} email The email of the User.
 *
 *
 * @apiSuccessExample {json} Success-Response:
 *   HTTP/1.1 200 OK
 *   {
 *     "user": {
 *       "_id": "58a1ea8b36dfb71d975384af",
 *       "email": "john@example.com"
 *     }
 *   }
 *
 */
router.get("/", getTokenValidator, Users.getUserByToken);

/**
 * @api {get} /users/:userId Get User
 * @apiName GetUser
 * @apiGroup User
 * @apiVersion 0.0.1
 *
 * @apiParam {String} userId The ID of the User to fetch.
 *
 *
 * @apiSuccess {String} _id  The ID of the User.
 * @apiSuccess {String} email The email of the User.
 *
 *
 * @apiSuccessExample {json} Success-Response:
 *   HTTP/1.1 200 OK
 *   {
 *     "_id": "58a1ea8b36dfb71d975384af",
 *     "email": "john@example.com"
 *   }
 *
 */
router.get("/:userId", getValidator, Users.getUser);

/**
 * @api {put} /users/:userId Update user
 * @apiName UpdateUser
 * @apiGroup User
 * @apiVersion 0.0.1
 *
 * @apiParam {String} userId The ID of the user to update.
 * @apiParam {Object} document An object containing any the fields of the user to update.
 *
 *
 * @apiParamExample {json} Request-Example:
 * {
 *   "_id": "58a1ea8b36dfb71d975384af",
 *   "document": {
 *      "email": j.doe@example.com"
 *   }
 * }
 *
 *
 * @apiSuccess {String} _id  The ID of the user.
 * @apiSuccess {String} email The email of the user.
 *
 *
 * @apiSuccessExample {json} Success-Response:
 *   HTTP/1.1 200 OK
 *   {
 *     "_id": "58a1ea8b36dfb71d975384af",
 *     "email": "j.doe@example.com"
 *   }
 *
 */
router.put("/:userId",  putValidator, Users.updateUser);

/**
 * @api {delete} /users/ Logout User
 * @apiName Logout
 * @apiGroup User
 * @apiVersion 0.0.1
 *
 * @apiHeader {String} authorization User token in bearer format.
 *
 * @apiHeaderExample {json} Header-Example:
 *     {
 *       "Authorization": "Bearer eyJraWQiOiJ1dURLVTMxZWRvTi0wd0x..."
 *     }
 *
 *
 * @apiSuccess {String} message  Message indicating user has been logged out.
 *
 *
 * @apiSuccessExample {json} Success-Response:
 *   HTTP/1.1 200 OK
 *   {
 *     "message": "User has been logged out"
 *   }
 */
router.delete("/logout", getTokenValidator, Users.logoutUser);

/**
 * @api {delete} /users/:userId Delete user
 * @apiName DeleteUser
 * @apiGroup User
 * @apiVersion 0.0.1
 *
 * @apiParam {String} userId The ID of the user to delete.
 *
 *
 * @apiSuccess {String} _id  The ID of the user.
 * @apiSuccess {String} email The email of the user.
 *
 *
 * @apiSuccessExample {json} Success-Response:
 *   HTTP/1.1 200 OK
 *   {
 *     "_id": "58a1ea8b36dfb71d975384af",
 *     "name": "j.doe@example.com"
 *   }
 */
router.delete("/:userId", deleteValidator, Users.removeUser);

module.exports = router;
