import "dotenv/config";
import mongoose from "mongoose";
import { after, before } from "node:test";

import { MONGODB_URL } from "../src/config/index.js";

before(async () => {
  await mongoose.connect(MONGODB_URL);
});

after(async () => {
  await mongoose.disconnect();
});
