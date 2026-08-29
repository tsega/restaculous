// Load Module Dependencies
import dotenv from 'dotenv';
dotenv.config();
import express from "express";
import mongoose from "mongoose";

import { MONGODB_URL, HTTP_PORT } from "./config/index.js";
import router from "./routes/index.js";

// Connect to Mongodb
mongoose.connect(MONGODB_URL)
  .then(() => {
    console.log("Mongodb connected successfully");
  })
  .catch((err) => {
    console.error("Connection to Mongodb Failed!", err);
  });

// Initialize app
const app = express();

// Set Middleware
app.use(express.json());

// Set Routes
router(app);

// Listen to HTTP Port
app.listen(HTTP_PORT, function listener() {
  console.log("API Server running on PORT %s", HTTP_PORT);
});

export default app;
