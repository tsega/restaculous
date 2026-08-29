import jwt from "jsonwebtoken";

import { JWT_KEY } from "../config/index.js";
import { HttpError } from "../utils/http-error.js";

export function requireAuthentication(req, res, next) {
  const [scheme, token] = (req.get("authorization") ?? "").split(" ");

  if (scheme !== "Bearer" || !token) {
    throw new HttpError(401, "Authentication required");
  }

  try {
    req.user = jwt.verify(token, JWT_KEY);
    next();
  } catch {
    throw new HttpError(401, "Invalid or expired token");
  }
}

export const checkAuthToken = requireAuthentication;
