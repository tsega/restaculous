// Load Module Dependencies
var express = require('express');
var bodyParser = require('body-parser');
var debug = require('debug');
var mongoose = require('mongoose');
var validator = require('express-validator');

// Load Custom Validator library
var customValidator = require('./lib/custom_validator');

var config = require('./config');
var router = require('./routes');

// Connect to Mongodb
mongoose.connect(config.MONGODB_URL);
// Listen to connection event
mongoose.connection.on('connected', function mongodbConnectionListener(err) {
    debug('Mongodb connected successfully');
});
// Handle error event
mongoose.connection.on('error', function mongodbErrorListener(err) {
    debug('Connection to Mongodb Failed!');

    // Try to reconnect
    mongoose.connect(config.MONGODB_URL);
});
// Initialize app
var app = express();

// Set Middleware
app.use(bodyParser.json());

// Set Validator
app.use(validator());

// Set Custom Validation
app.use(customValidator());

// Set Routes
router(app);

// Listen to HTTP Port
app.listen(config.HTTP_PORT, function listener() {
    debug('API Server running on PORT %s', config.HTTP_PORT);
});

module.exports = app;