// Load Module Dependencies
require('dotenv').config();
var express = require("express");
var mongoose = require("mongoose");

var { MONGODB_URL, HTTP_PORT } = require("./config");
var router = require("./routes");

// Connect to Mongodb
mongoose.connect(
  MONGODB_URL,
  {
    useNewUrlParser: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
    useCreateIndex: true
  },
  function(err) {
    if (err) {
      console.error("Connection to Mongodb Failed!");

      // Try to reconnect
      mongoose.connect(MONGODB_URL);
    }

    console.log("Mongodb connected successfully");
  }
);

// Initialize app
var app = express();

// Set Middleware
app.use(express.json());

// Set Routes
router(app);

// Listen to HTTP Port
app.listen(HTTP_PORT, function listener() {
  console.log("API Server running on PORT %s", HTTP_PORT);
});

module.exports = app;
