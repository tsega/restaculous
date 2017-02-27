// Load Module Dependencies
var mongoose = require('mongoose');

var User = require('./user');

// Define Token attributes
var TokenSchema = mongoose.Schema({
    user: {type: mongoose.Schema.ObjectId, ref: 'User'},
    value: { type: String},
    revoked: { type: Boolean, default: true},
    expires: { type: Date },
    date_created: {type: Date},
    last_modified: {type: Date}
});

// Export Token Model
module.exports = mongoose.model('Token', TokenSchema);