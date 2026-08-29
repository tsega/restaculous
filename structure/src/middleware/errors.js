import { logger } from "../utils/logger.js";

export function notFoundHandler(req, res) {
  void req;
  res.status(404).json({ error: "Route not found" });
}

export function errorHandler(error, req, res, next) {
  void req;
  void next;
  const status = getStatus(error);

  if (status >= 500) {
    logger.error("Request failed", {
      method: req.method,
      path: req.path,
      status,
      error
    });
  }

  res.status(status).json({
    error: status >= 500 ? "Internal server error" : error.message
  });
}

function getStatus(error) {
  if (error.code === 11000) {
    return 409;
  }
  if (error.name === "CastError") {
    return 400;
  }
  if (error.name === "ValidationError") {
    return 422;
  }
  return error.status ?? error.statusCode ?? 500;
}
