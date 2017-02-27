// Load Module Dependencies
var Token = require('../models/token');

// - create
exports.create = function create(data, cb){
    var newToken = new Token(data);

    newToken.save(function done(err, token){
        if(err){
            return cb(err);
        }

        cb(null, token);
    });
};

// - get
exports.get = function get(query, cb){
    Token.findOne(query, function done(err, token){
        if(err){
            return cb(err);
        }

        cb(null,  token || {});
    });
};

// - delete
exports.delete = function remove(query, cb){
    exports.get(query, function done(err, token) {
        if(err){
            cb(err);
        }

        if(token._id){
            Token.remove(token, function complete(err){
                if(err){
                    return cb(err);
                }

                // Returning to stop processing here
                return cb(null, token);
            });
        } else {
            return cb(null, token);
        }
    });
};

// - update
exports.update = function update(query, data, cb){
    Token.findOneAndUpdate(query, data, function done(err, token){
        if(err){
            return cb(err);
        }

        cb(null, token || {});
    });
};

// - getCollection
exports.getCollection = function getCollection(query, cb){
    Token.find(query, function done(err, docs){
        if(err){
            return cb(err);
        }

        cb(null, docs);
    });
};

// - deleteCollection
exports.deleteCollection = function deleteCollection(query, cb){
    Token.remove(query, function done(err){
        if(err){
            return cb(err);
        }

        cb(null);
    });
};