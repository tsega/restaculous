import "dotenv/config";
import mongoose from "mongoose";

import app from "./app.js";
import { HTTP_PORT, MONGODB_URL } from "./config/index.js";

async function startServer() {
  await mongoose.connect(MONGODB_URL);
  app.listen(HTTP_PORT, () => {
    console.log(`API server running on port ${HTTP_PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Unable to start API server", error);
  process.exitCode = 1;
});
