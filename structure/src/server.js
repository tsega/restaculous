import "dotenv/config";
import mongoose from "mongoose";

import app from "./app.js";
import { HTTP_PORT, MONGODB_URL } from "./config/index.js";
import { logger } from "./utils/logger.js";

let server;

async function startServer() {
  await mongoose.connect(MONGODB_URL);
  logger.info("Connected to MongoDB");
  server = app.listen(HTTP_PORT, () => {
    logger.info("API server started", { port: HTTP_PORT });
  });
}

async function shutdown(signal) {
  logger.info("Shutting down API server", { signal });

  if (server) {
    await new Promise((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  }
  await mongoose.disconnect();
  logger.info("API server stopped");
}

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.once(signal, () => {
    shutdown(signal).catch((error) => {
      logger.error("Unable to shut down API server cleanly", { error });
      process.exitCode = 1;
    });
  });
}

startServer().catch((error) => {
  logger.error("Unable to start API server", { error });
  process.exitCode = 1;
});
