import { performance } from "node:perf_hooks";

import { logger } from "../utils/logger.js";

export function requestLogger(req, res, next) {
  const startedAt = performance.now();

  res.once("finish", () => {
    logger.info("HTTP request completed", {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      durationMs: Math.round(performance.now() - startedAt)
    });
  });

  next();
}
