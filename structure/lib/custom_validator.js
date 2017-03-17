// Load Module Dependencies
var expressValidator = require('express-validator');
var ObjectId = require('mongoose').Types.ObjectId;

/*
 *  CustomValidators
 *
 *  A collection of custom validation middleware
 *
 */
module.exports = function () {
    return expressValidator({
        customValidators: {
            // Checks if the _id of the document is a valid ObjectId
            isObjectId: function (value) {
                return ObjectId.isValid(value);
            }
        }
    });
};