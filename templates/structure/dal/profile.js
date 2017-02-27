// Load Module Dependencies
var Profile = require('../models/profile');

// - create
exports.create = function create(data, cb){
    var newProfile = new Profile(data);

    newProfile.save(function done(err, profile){
        if(err){
            return cb(err);
        }

        cb(null, profile);
    });
};

// - get
exports.get = function get(query, cb){
    Profile.findOne(query, function done(err, profile){
        if(err){
            return cb(err);
        }

        cb(null,  profile || {});
    });
};

// - delete
exports.delete = function remove(query, cb){
    exports.get(query, function done(err, profile) {
        if(err){
            cb(err);
        }

        if(profile._id){
            Profile.remove(profile, function complete(err){
                if(err){
                    return cb(err);
                }

                // Returning to stop processing here
                return cb(null, profile);
            });
        } else {
            return cb(null, profile);
        }
    });
};

// - update
exports.update = function update(query, data, cb){
    Profile.findOneAndUpdate(query, data, function done(err, profile){
        if(err){
            return cb(err);
        }

        cb(null, profile || {});
    });
};

// - getCollection
exports.getCollection = function getCollection(query, cb){
    Profile.find(query, function done(err, docs){
        if(err){
            return cb(err);
        }

        cb(null, docs);
    });
};

// - deleteCollection
exports.deleteCollection = function deleteCollection(query, cb){
    Profile.remove(query, function done(err){
        if(err){
            return cb(err);
        }

        cb(null);
    });
};