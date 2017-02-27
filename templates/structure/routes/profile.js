// Load Module Dependencies
var express = require('express');

var Profile = require('../controllers/profile');

// Create a router
var router = express.Router();

/**
 * @api {get} /profiles/:profileId Get profile
 * @apiName GetProfile
 * @apiGroup Profile
 * @apiVersion 0.0.1
 *
 * @apiParam {String} profileId The ID of the profile to fetch.
 *
 * @apiSuccess {String} _id            The ID of the profile.
 * @apiSuccess {Date}   last_modified  Timestamp at which the profile was updated.
 * @apiSuccess {Date}   date_created   Timestamp at which the profile was created.
 * @apiSuccess {String} first_name     The first_name of the profile.
 * @apiSuccess {String} last_name      The last_name of the profile.
 * @apiSuccess {String} user           The ID of the user the profile references to.
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "_id": "58a1ea8b36dfb71d975384af",
 *       "last_modified": "2017-02-13T17:19:08.404Z",
 *       "date_created": "2017-02-13T17:19:08.404Z",
 *       "first_name": "John",
 *       "last_name": "Doe",
 *       "user": "89a1ea8b36dfb71d975384af"
 *     }
 */
router.get('/:profileId', Profile.getProfile);

/**
 * @api {put} /profiles/:profileId Update profile
 * @apiName UpdateProfile
 * @apiGroup Profile
 * @apiVersion 0.0.1
 *
 * @apiParam {String} [first_name] The first name value to update.
 * @apiParam {String} [last_name] The last name value to update.
 *
 * @apiParamExample {json} Request-Example:
 *       {
 *	       "first_name": "Jane",
 *	       "last_name": "Mane"
 *       }
 *
 * @apiSuccess {String} _id            The ID of the updated profile.
 * @apiSuccess {Date}   last_modified  Timestamp at which the profile was updated.
 * @apiSuccess {Date}   date_created   Timestamp at which the profile was created.
 * @apiSuccess {String} first_name     The first_name of the profile.
 * @apiSuccess {String} last_name      The last_name of the profile.
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "_id": "58a1ea8b36dfb71d975384af",
 *       "last_modified": "2017-02-24T17:07:38.404Z",  // This field will be updated
 *       "date_created": "2017-02-13T17:19:08.404Z",
 *       "first_name": "Jane",
 *       "last_name": "Mane",
 *       "user": "89a1ea8b36dfb71d975384af"
 *     }
 */
router.put('/:profileId', Profile.updateProfile);

// Export the router
module.exports = router;