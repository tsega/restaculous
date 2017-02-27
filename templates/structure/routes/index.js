// Load Module Dependencies
var express = require('express');

var profileRouter = require('./profile');
var useRouter = require('./user');

// Export Router Initializer
module.exports = function iniRouter(app) {
    // Profile Endpoint
    app.use('/profiles', profileRouter);

    // Users Endpoint
    app.use('/users', useRouter);
};