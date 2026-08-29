// Load Modules
import jwt from "jsonwebtoken";

// Get Config file
import { JWT_KEY } from "../config/index.js";

export const checkAuthToken = (req, res, next) => {
  try {
    var token = req.headers.authorization.split(" ")[1];
    var decoded = jwt.verify(token, JWT_KEY);

    // Add the user data to the request
    req.userData = decoded;

    next();
  } catch(error) {
    return res.status(401).json({
      message: "Auth Failed"
    });
  }
};
