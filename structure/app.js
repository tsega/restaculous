// Load Module Dependencies
var express = require("express");
var mongoose = require("mongoose");

var config = require("./config");
var router = require("./routes");

// Connect to Mongodb
mongoose.connect(
  config.MONGODB_URL,
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
      mongoose.connect(config.MONGODB_URL);
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
app.listen(config.HTTP_PORT, function listener() {
  console.log("API Server running on PORT %s", config.HTTP_PORT);
});

module.exports = app;
