// Required configuration

export const HTTP_PORT = parseInt(process.env.HTTP_PORT);
export const MONGODB_URL = process.env.MONGODB_URL;
export const SALT_LENGTH = parseInt(process.env.SALT_LENGTH);
export const JWT_KEY = process.env.JWT_KEY;
export const MAX_PAGE_SIZE = parseInt(process.env.MAX_PAGE_SIZE);
export const DEFAULT_SORT = process.env.DEFAULT_SORT;
