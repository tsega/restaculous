# Rest-a-culous

An opinionated ExpressJs based REST API generator.

## Installation
To use the generator simply install it globally using NPM:

`npm install -g restaculous`

## Features
The generator produces a fully functional REST API based
on [NodeJs](https://nodejs.org), [ExpressJs](http://expressjs.com) and [MongoDB](https://www.mongodb.com/).

The application generated has the following features:

  - [x] Fully tested API endpoints with **CRUD** operations
  - [x] Express-Validator Integration
  - [x] Automatically generate API documentation
  - [x] Linting of source to ensure proper code formatting
  - [x] **Authentication**
  - [ ] **Authorization**
  - [ ] Wizard to generate `settings.json` file
  - [ ] Logging Integration
  - [ ] `.env` Integration
  - [ ] Microservices Setup


## Structure
The generate application structure looks as follows.
```
..
.
 |--config/                 # configuration settings
 |--controllers/            # controllers based on models
 |--dal/                    # data access layer containing abstractions over models
 |--docs/                    # Auto-generated documentation for API endpoints
 |--lib/                    # utility library to do common tasks
 |--models/                 # the underlying models of the system
 |--routes/                 # REST-based API endpoints
   |--validators/           # Validators for API endpoints
 |--test/                   # tests for the entire code base
 |--.gitignore              # common file and folders to ignore by git
 |--app.js                  # the applications main entry point
 |--package.json            # specifies modules/packages used in the app
 |--README.md               # an introductory text about the application
```

## Generate from a `settings.json` file
You can generate an entire application by simply supplying a **json** settings file in the following format.

```json
{
  "name": "[name of the application]",
  "description": "[small description about the application]",
  "author": "[author name] <author email>",
  "directory": "[the directory where to output the new application]",
  "repository": {
    "type": "[repository type]",
    "url": "[repository address]"
  },
  "config": [
    {
    "name": "[name of the configuration]",
    "value":"[value of the configuration]",
    "comment": "[short comment about the config]"
    }
  ],
  "models": [
    {
      "name": "[model name(capitalized)]",
      "authentication": "[0 or more of the following 'get','post','put','delete','search']",
      "attributes": [
        {
          "name": "[name of the attribute]",
          "type": "[the data type of the attribute]",
          "desc": "[a small description about the attribute]",
          "example": "[an example of the attribute]",
          "validation": [
            { "type": "[based on Express Validator]" , "message": "[message to show when validation fails]"}
          ],
          "isPrivate": "[indicates the attribute will not be returned, e.g. password (optional)]",
          "isAuto": "[indicates that the value for the attribute will be generated automatically]"
        }
      ],
      "relations": [{
        "name": "[name of a related model(capitalized)]",
        "referenceType": "multiple"
      }]
    }
  ]
}
```

> Note: For details on the **Express Validator** validators, please look at its [documentation on GitHub](https://github.com/validatorjs/validator.js#validators).

Here is a [Gist](https://gist.github.com/tsega/b15307af018d49171dfdbde47f0d2d07) with an example `settings.json` file.

> **Important:**
 - The top level `authentication` (Boolean) property adds token based authentication to the application.
 - The model level `authentication` (Array of Action Names) property specifies the API endpoints that require authentication to access. If you don't want authentication added, this key needs to be removed or left as an empty array.
 - Timestamp attributes, i.e. `createdAt` and `updatedAt` are automatically added to all models.
 - All settings fields in the above example are required except the ones identified as being optional. All **configuration entries** are mandatory; a starter `settings.json` file is given below:

**DON'T FORGET TO REPLACE [app-name]**

```json
{
  "name": "[app-name]",
  "description": "",
  "author": "",
  "directory": "",
  "repository": {
    "type": "",
    "url": ""
  },
  "authentication": true,
  "config": [
    {"name": "HTTP_PORT", "value":"process.env.HTTP_PORT || 8000", "comment": "HTTP PORT"},
    {"name": "MONGODB_URL", "value":"'mongodb://localhost/[app-name]'", "comment": "Mongodb URL"},
    {"name": "SALT_LENGTH", "value":"13", "comment": "SALT VALUE LENGTH"},
    {"name": "TOKEN_LENGTH", "value":"253", "comment": "TOKEN LENGTH"},
    {"name": "MAX_PAGE_SIZE", "value":"100", "comment": "DEFAULT PAGE SIZE"},
    {"name": "DEFAULT_SORT", "value":"'updatedAt'", "comment": "DEFAULT SORT FIELD"}
  ],
  "models": [
    {
      "name": "",
      "authentication": ['get','post','put','delete','search'],
      "attributes": [
        {
          "name": "",
          "type": "",
          "desc": "",
          "example": "",
          "validation": [
            { "type": "", "message": "" }
          ]
        }
      ]
    }
  ]
}
```
