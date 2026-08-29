function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const HTTP_PORT = Number.parseInt(process.env.HTTP_PORT ?? "8000", 10);
export const MONGODB_URL = required("MONGODB_URL");
export const SALT_LENGTH = Number.parseInt(process.env.SALT_LENGTH ?? "12", 10);
export const JWT_KEY = required("JWT_KEY");
export const MAX_PAGE_SIZE = Number.parseInt(process.env.MAX_PAGE_SIZE ?? "100", 10);
export const DEFAULT_SORT = process.env.DEFAULT_SORT ?? "-updatedAt";
