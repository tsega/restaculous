import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false }
  },
  {
    timestamps: true,
    toJSON: {
      transform(document, result) {
        void document;
        delete result.password;
        return result;
      }
    }
  }
);

export default mongoose.model("User", userSchema);
