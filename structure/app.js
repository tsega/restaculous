// Load Module Dependencies
var express = require("express");
var mongoose = require("mongoose");
var validator = require("express-validator");

// Load Custom Validator library
var customValidator = require("./lib/custom_validator");

var config = require("./config");
var router = require("./routes");

// Connect to Mongodb
mongoose.connect(config.MONGODB_URL, { useNewUrlParser: true }, function(err) {
  if (err) {
    console.error("Connection to Mongodb Failed!");

    // Try to reconnect
    mongoose.connect(config.MONGODB_URL);
  }

  console.log("Mongodb connected successfully");
});

// Initialize app
var app = express();

// Set Middleware
app.use(express.json());

// Set Validator
app.use(validator());

// Set Custom Validation
app.use(customValidator());

// Set Routes
router(app);

// Listen to HTTP Port
app.listen(config.HTTP_PORT, function listener() {
  console.log("API Server running on PORT %s", config.HTTP_PORT);
});

module.exports = app;
