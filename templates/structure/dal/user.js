// Load Module Dependencies
var User = require('../models/user');

// - create
exports.create = function create(data, cb){
    var newUser = new User(data);

    newUser.save(function done(err, user){
        if(err){
            return cb(err);
        }

        cb(null, user);
    });
};

// - get
exports.get = function get(query, cb){
    User.findOne(query, function done(err, user){
        if(err){
            return cb(err);
        }

        cb(null,  user || {});
    });
};

// - delete
exports.delete = function remove(query, cb){
    exports.get(query, function done(err, user) {
        if(err){
            cb(err);
        }

        if(user._id){
            User.remove(user, function complete(err){
                if(err){
                    return cb(err);
                }

                // Returning to stop processing here
                return cb(null, user);
            });
        } else {
            return cb(null, user);
        }
    });
};

// - update
exports.update = function update(query, data, cb){
    User.findOneAndUpdate(query, data, function done(err, user){
        console.log(user);
        if(err){
            return cb(err);
        }

        cb(null, user || {});
    });
};

// - getCollection
exports.getCollection = function getCollection(query, fields, options, cb){
    User.find(query, fields, options, function done(err, docs){
        if(err){
            return cb(err);
        }

        cb(null, docs);
    });
};

// - deleteCollection
exports.deleteCollection = function deleteCollection(query, cb){
    User.remove(query, function done(err){
        if(err){
            return cb(err);
        }

        cb(null);
    });
};