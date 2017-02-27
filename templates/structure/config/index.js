// Load Module Dependencies

module.exports = {
    // HTTP PORT
    HTTP_PORT: process.env.HTTP_PORT || 8000,
    // Mongodb URL
    MONGODB_URL: 'mongodb://localhost/gebeya',
    // SALT VALUE LENGTH
    SALT_LENGTH: 13,
    // TOKEN LENGTH
    TOKEN_LENGTH: 253,
    // DEFAULT PAGE SIZE
    PAGE_SIZE: 50,
};