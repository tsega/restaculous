// Load Module Dependencies
var express = require('express');

var User = require('../controllers/user');
var Auth = require('../controllers/auth');

// Create a router
var router = express.Router();

/**
 * @api {post} /users/signup Signup user
 * @apiName CreateUser
 * @apiGroup User
 * @apiVersion 0.0.1
 *
 * @apiParam {String} email       The email of the user to be used as username.
 * @apiParam {String} password    The password of the user.
 * @apiParam {String} user_type   The user group of the user, i.e. talent, client
 * @apiParam {String} first_name  The first name of the user.
 * @apiParam {String} last_name   The last name of the user.
 *
 * @apiParamExample {json} Request-Example:
 *       {
 *	       "email": "John.Doe@example.com",
 *	       "password": "Password",
 *	       "user_type": "talent",
 *	       "first_name": "John",
 *	       "last_name": "Doe"
 *       }
 *
 * @apiSuccess {String} _id            The ID of the newly created user.
 * @apiSuccess {Date}   last_modified  Timestamp at which the user was updated.
 * @apiSuccess {Date}   date_created   Timestamp at which the user was created.
 * @apiSuccess {String} username       The username, i.e the email of the user.
 * @apiSuccess {String} role           The user group of the user, i.e. client, talent
 * @apiSuccess {String} status         The status of the use.
 * @apiSuccess {String} realm          The realm of the user.

 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 201 OK
 *     {
 *       "_id": "58a1ea8b36dfb71d975384af",
 *       "last_modified": "2017-02-13T17:19:08.404Z",
 *       "date_created": "2017-02-13T17:19:08.404Z",
 *       "username": "John.Doe@example.com",
 *       "role": "talent",
 *       "status": "active",
 *       "realm": "user",
 *       "profile": "89a1ea8b36dfb71d975384af"
 *     }
 */
router.post('/signup', User.createUser);

/**
 * @api {post} /users/login Login user
 * @apiName LoginUser
 * @apiGroup User
 * @apiVersion 0.0.1
 *
 * @apiParam {String} email     The email of the user to be used as username.
 * @apiParam {String} password  The password of the user.
 *
 * @apiParamExample {json} Request-Example:
 *       {
 *	       "email": "John.Doe@example.com",
 *	       "password": "Password",
 *       }
 *
 * @apiSuccess {Object} token  Newly created/re-generated token at to be used with other requests.
 * @apiSuccess {Object} user   The user document of the ID of the newly created user.
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *         "token": "7IqlDMf6dAoTqirHs313xwVzjwPgKKr4TNVA6HbyOBTOqgPtc0c4ate...==",
 *         "user": {
 *           "_id": "58a1cc5fbf8e4e0f5bb65245",
 *           "last_modified": "2017-02-13T15:10:24.509Z",
 *           "date_created": "2017-02-13T15:10:24.509Z",
 *           "username": "John.Doe@example.com",
 *           "role": "talent",
 *           "last_login": "2017-02-13T17:07:18.458Z",
 *           "status": "active",
 *           "realm": "user"
 *         }
 *     }
 */
router.post('/login', Auth.login);

/**
 * @api {post} /users/logout Logout user
 * @apiName LogoutUser
 * @apiGroup User
 * @apiVersion 0.0.1
 *
 * @apiParam {String} token The login token of the user.
 *
 * @apiParamExample {json} Request-Example:
 *       {
 *	       "token": "7IqlDMf6dAoTqirHs313xwVzjwPgKKr4TNVA6HbyOBTOqgPtc0c4ate...=="
 *       }
 *
 * @apiSuccess {String} message Message indicating successful logout.
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       message: "User Successfully logged out!"
 *     }
 */
router.post('/logout', Auth.logout);

/**
 * @api {get} /users/all Get paged user
 * @apiName GetUsers
 * @apiGroup User
 * @apiVersion 0.0.1
 *
 * @apiParam {String} [filter]   The filtering to select the users to return.
 * @apiParam {String} [fields]   The fields of the user document to return.
 * @apiParam {String} [pageSize] The maximum number of users to return.
 * @apiParam {String} [page]     The page number used to determine how many documents to skip.
 * @apiParam {String} [sort]     The sort field to use in ascending or descending order.
 *
 * @apiParamExample {json} Request-Example:
 *     {
 *       "filter": "status:active,realm:user",
 *       "fields": "username role status realm last_modified date_created last_login",
 *       "pageSize": 50,
 *       "page": 1,
 *       "sort": "-date_created"
 *     }
 *
 * @apiSuccess {Object[]} users                List of users.
 * @apiSuccess {String}   users._id            The ID of a user.
 * @apiSuccess {Date}     users.last_modified  Timestamp at which the user was updated.
 * @apiSuccess {Date}     users.date_created   Timestamp at which the user was created.
 * @apiSuccess {String}   users.username       The username, i.e the email of a user.
 * @apiSuccess {String}   users.role           The user group of a user, i.e. client, talent
 * @apiSuccess {String}   users.status         The status of a user.
 * @apiSuccess {String}   users.realm          The realm of a user.
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     [
 *     {
 *       "_id": "58a1ea8b36dfb71d975384af",
 *       "last_modified": "2017-02-13T17:19:08.404Z",
 *       "date_created": "2017-02-13T17:19:08.404Z",
 *       "username": "John.Doe@example.com",
 *       "role": "talent",
 *       "status": "active",
 *       "realm": "user",
 *       "profile": "89a1ea8b36dfb71d975384af"
 *     },
 *     {
 *       "_id": "990878b36dfb71d975384af",
 *       "last_modified": "2017-02-13T17:19:08.404Z",
 *       "date_created": "2017-02-13T17:19:08.404Z",
 *       "username": "Jane.Doe@example.com",
 *       "role": "talent",
 *       "status": "active",
 *       "realm": "user",
 *       "profile": "89a1ea8b36dfb71d975384af"
 *     },
 *    ]
 */
router.get('/all', User.getUsers);

/**
 * @api {get} /users/:userId Get user
 * @apiName GetUser
 * @apiGroup User
 * @apiVersion 0.0.1
 *
 * @apiParam {String} userId The ID of the user to fetch.
 *
 * @apiSuccess {String} _id            The ID of the user.
 * @apiSuccess {Date}   last_modified  Timestamp at which the user was updated.
 * @apiSuccess {Date}   date_created   Timestamp at which the user was created.
 * @apiSuccess {String} username       The username, i.e the email of the user.
 * @apiSuccess {String} role           The user group of the user, i.e. client, talent
 * @apiSuccess {String} status         The status of the use.
 * @apiSuccess {String} realm          The realm of the user.
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "_id": "58a1ea8b36dfb71d975384af",
 *       "last_modified": "2017-02-13T17:19:08.404Z",
 *       "date_created": "2017-02-13T17:19:08.404Z",
 *       "username": "John.Doe@example.com",
 *       "role": "talent",
 *       "status": "active",
 *       "realm": "user",
 *       "profile": "89a1ea8b36dfb71d975384af"
 *     }
 */
router.get('/:userId', User.getUser);

/**
 * @api {put} /users/:userId Update user
 * @apiName UpdateUser
 * @apiGroup User
 * @apiVersion 0.0.1
 *
 * @apiParam {String} email The email of the user to be used as username.
 * @apiParam {String} password The password of the user.
 * @apiParam {String} user_type The user group of the user, i.e. talent, client
 *
 * @apiParamExample {json} Request-Example:
 *       {
 *	       "email": "John.Doe@example.com",
 *	       "password": "Password",
 *	       "user_type": "talent"
 *       }
 *
 * @apiSuccess {String} _id             The ID of the newly created user.
 * @apiSuccess {Date}   last_modified   Timestamp at which the user was updated.
 * @apiSuccess {Date}   date_created    Timestamp at which the user was created.
 * @apiSuccess {String} username        The username, i.e the email of the user.
 * @apiSuccess {String} role            The user group of the user, i.e. client, talent
 * @apiSuccess {String} status          The status of the use.
 * @apiSuccess {String} realm           The realm of the user.
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "_id": "58a1ea8b36dfb71d975384af",
 *       "last_modified": "2017-02-24T17:07:38.404Z",  // This field will be updated
 *       "date_created": "2017-02-13T17:19:08.404Z",
 *       "email": "John.Doe@example.com",
 *       "role": "talent",
 *       "status": "active",
 *       "realm": "user",
 *       "profile": "89a1ea8b36dfb71d975384af"
 *     }
 */
router.put('/:userId', User.updateUser);

/**
 * @api {delete} /users/:userId Delete user
 * @apiName DeleteUser
 * @apiGroup User
 * @apiVersion 0.0.1
 *
 * @apiParam {String} userId     The id of the User to delete.
 *
 * @apiSuccess {Object} user     The user that has been deleted.
 * @apiSuccess {Object} profile  The profile of the deleted user.
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "user": {
 *         "_id": "58b2d235d6003324b69bb425",
 *         "last_modified": "2017-02-26T13:03:50.106Z",
 *         "date_created": "2017-02-26T13:03:50.106Z",
 *         "username": "John.Doe@example.com",
 *         "role": "talent",
 *         "status": "active",
 *         "realm": "user"
 *       },
 *       "profile": {
 *         "_id": "58b2d236d6003324b69bb426",
 *         "user": "58b2d235d6003324b69bb425",
 *         "first_name": "John",
 *         "last_name": "Doe",
 *        }
 *     }
 */
router.delete('/:userId', User.removeUser);

// Export the router
module.exports = router;