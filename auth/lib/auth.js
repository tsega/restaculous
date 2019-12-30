// Load Modules
var jwt = require("jsonwebtoken");

// Get Config file
var config = require("../config");

exports.checkAuthToken = (req, res, next) => {
  try {
    var token = req.headers.authorization.split(" ")[1];
    var decoded = jwt.verify(token, config.JWT_KEY);

    // Add the user data to the request
    req.userData = decoded;

    next();
  } catch(error) {
    return res.status(401).json({
      message: "Auth Failed"
    });
  }
};
