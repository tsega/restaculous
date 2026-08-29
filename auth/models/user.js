import mongoose from "mongoose";

// Define User attributes
const UserSchema = mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
  },
  {
    timestamps: true
  }
);

// Export User model
export default mongoose.model("User", UserSchema);
