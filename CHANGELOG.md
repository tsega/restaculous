# Restaculous Change Log

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/) and this project adheres to [Semantic Versioning](http://semver.org/).
## 1.9.1
- Fix bug with fuzzy search and ObjectIds
## 1.9.0
- Add total and filtered counts in search options
## 1.8.5
- Add fuzzy search to Search endpoint
## 1.8.0
- Add complete CRUD operation on User resource
- Add `GetUserbyToken`
- Add Auth Logout
## 1.7.5
- Add dotenv file support

## 1.7.0
- Add token based Authentication, configurable through the settings file

## 1.5.0
- Add formatting (Prettier) and linting (eslint) after code base is generated
- Update use of Express-Validator
- Add validation field in `settings.json`
- Add [nodemon](https://www.npmjs.com/package/nodemon) as a dev dependency
- Remove Mongoose and Express-Validator deprecation warnings

## 1.0.2
- Add community related documentation
- Replace manual model timestamps with auto-generated ones

## 1.0.0
- Automatically generate API documentation
- Update dependencies to latest versions, except for Express
- Remove debug, moment, bodyParser, lodash
