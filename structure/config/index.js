// Required configuration

module.exports = {
  HTTP_PORT: parseInt(process.env.HTTP_PORT),
  MONGODB_URL: process.env.MONGODB_URL,
  SALT_LENGTH: parseInt(process.env.SALT_LENGTH),
  JWT_KEY: process.env.JWT_KEY,
  MAX_PAGE_SIZE: parseInt(process.env.MAX_PAGE_SIZE),
  DEFAULT_SORT: process.env.DEFAULT_SORT
};
