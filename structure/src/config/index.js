function required(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function positiveInteger(name, fallback, maximum = Number.MAX_SAFE_INTEGER) {
  const rawValue = process.env[name] ?? String(fallback);
  const value = Number(rawValue);

  if (!Number.isInteger(value) || value <= 0 || value > maximum) {
    throw new Error(
      `Invalid environment variable ${name}: expected an integer between 1 and ${maximum}`
    );
  }
  return value;
}

export const HTTP_PORT = positiveInteger("HTTP_PORT", 8000, 65535);
export const MONGODB_URL = required("MONGODB_URL");
export const SALT_LENGTH = positiveInteger("SALT_LENGTH", 12);
export const JWT_KEY = required("JWT_KEY");
export const MAX_PAGE_SIZE = positiveInteger("MAX_PAGE_SIZE", 100);
export const DEFAULT_SORT = process.env.DEFAULT_SORT ?? "-updatedAt";
