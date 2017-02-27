// Load Module Dependencies
var mongoose = require('mongoose');

var User = require('./user');

// Define Profile attributes
var ProfileSchema = mongoose.Schema({
    user: {type: mongoose.Schema.ObjectId, ref: 'User'},
    first_name: {type: String},
    last_name: {type: String},
    email: {type: String},
    date_of_birth: {type: Date},
    date_created: {type: Date},
    last_modified: {type: Date}
});

// Export Profile Model
module.exports = mongoose.model('Profile', ProfileSchema);