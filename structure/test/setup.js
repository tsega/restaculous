import "dotenv/config";
import mongoose from "mongoose";
import { after, before } from "node:test";

const testDatabaseUrl = required("TEST_MONGODB_URL");
const applicationDatabaseUrl = process.env.MONGODB_URL?.trim();
let connected = false;

if (testDatabaseUrl === applicationDatabaseUrl) {
  throw new Error(
    "Unsafe test configuration: TEST_MONGODB_URL must differ from MONGODB_URL"
  );
}

before(async () => {
  await mongoose.connect(testDatabaseUrl);
  connected = true;
});

after(async () => {
  if (!connected) {
    return;
  }

  try {
    await mongoose.connection.dropDatabase();
  } finally {
    await mongoose.disconnect();
  }
});

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required test environment variable: ${name}`);
  }
  return value;
}
