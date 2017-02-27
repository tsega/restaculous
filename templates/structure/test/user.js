// Load Module Dependencies
var request = require('supertest');
var chai = require('chai');

var app = require('../app');

var expect = chai.expect;

describe('User Endpoint', function () {
    var credentials = {
        'email': 'John@example.com',
        'password': 'password',
        'first_name': 'John',
        'last_name': 'Doe'
    };

    describe('#Talent POST /users/signup', function () {
        credentials.user_type = 'talent';

        it('should create a new talent user', function (done) {

            request(app)
                .post('/users/signup')
                .set('Content-Type', 'application/json; charset=utf-8')
                .send(credentials)
                .expect('Content-Type', 'application/json; charset=utf-8')
                .expect(201)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }

                    // Assertion tests on request body
                    expect(res.body._id).to.be.a('string');
                    expect(res.body.role).to.equal('talent');

                    done();
                });
        });
    });

    describe('#Talent POST /users/login', function () {
        it('should should login talent user', function (done) {

            request(app)
                .post('/users/login')
                .set('Content-Type', 'application/json; charset=utf-8')
                .send({username: credentials.email, password: credentials.password})
                .expect('Content-Type', 'application/json; charset=utf-8')
                .expect(200)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }

                    // Assertion tests on request body
                    expect(res.body.token).to.be.a('string');

                    done();
                });
        });
    });
});

