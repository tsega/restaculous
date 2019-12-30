var mongoose = require("mongoose");

// Define User attributes
var UserSchema = mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
  },
  {
    timestamps: true
  }
);

// Export User model
module.exports = mongoose.model("User", UserSchema);
