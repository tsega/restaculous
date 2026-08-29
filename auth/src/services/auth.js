import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { JWT_KEY, SALT_LENGTH } from "../config/index.js";
import { HttpError } from "../utils/http-error.js";
import User from "../models/user.js";

export async function register(credentials) {
  const password = await bcrypt.hash(credentials.password, SALT_LENGTH);
  return User.create({ ...credentials, password });
}

export async function login({ email, password }) {
  const user = await User.findOne({ email }).select("+password");
  const matches = user && await bcrypt.compare(password, user.password);

  if (!matches) {
    throw new HttpError(401, "Invalid email or password");
  }

  return jwt.sign({ sub: user.id, email: user.email }, JWT_KEY, {
    expiresIn: "1d"
  });
}
