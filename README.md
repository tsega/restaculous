# Rest-a-culous

An opinionated ExpressJs based REST API generator.

## CLI usage

Generate an application with either the explicit command or the original
settings-file shorthand:

```sh
resta generate settings.json
resta settings.json
```

Create a settings file interactively:

```sh
resta init
resta init custom-settings.json
```

The initializer uses the generator's defaults to keep the resulting file small.
It will not overwrite an existing file without confirmation.

```sh
resta --help
resta --version
```

The original `restaculous` command remains available as a compatibility alias.

## CLI development and tests

CLI development requires Node.js 24 or newer. The repository includes an
`.nvmrc` file pinned to the Node.js 24 LTS release used by the project. With
[nvm](https://github.com/nvm-sh/nvm) installed, select it with:

```sh
nvm install
nvm use
```

The generator CLI uses Node.js's built-in test runner, so its tests do not
require a separate test framework. Install the project dependencies and run:

```sh
npm test
```

The CLI test suite is kept in `test/` and checks command-line behavior,
settings-file loading and validation, workflow order and failure handling, and
focused generator output. These tests cover the generator itself; they are
separate from the tests included in applications produced from the `structure/`
and `templates/` assets.

## Installation
To use the generator simply install it globally using NPM:

`npm install -g restaculous`

## Features
The generator produces a fully functional REST API based
on [NodeJs](https://nodejs.org), [ExpressJs](http://expressjs.com) and [MongoDB](https://www.mongodb.com/).

The application generated has the following features:

  - [x] Fully tested API endpoints with **CRUD** operations
  - [x] Express-Validator Integration
  - [ ] OpenAPI documentation
  - [x] Linting of source to ensure proper code formatting
  - [x] **Authentication**
  - [ ] **Authorization**
  - [ ] Wizard to generate `settings.json` file
  - [ ] Logging Integration
  - [x] `.env` Integration
  - [ ] Microservices Setup


## Structure
The generate application structure looks as follows.
```
..
.
 |--src/
   |--config/               # environment-backed configuration
   |--controllers/          # HTTP request and response handling
   |--middleware/           # validation, authentication, and errors
   |--models/               # Mongoose schemas and models
   |--routes/               # REST endpoints and validators
   |--services/             # business operations such as authentication
   |--utils/                # shared query and HTTP helpers
   |--app.js                # Express application construction
   |--server.js             # database connection and server startup
 |--test/                   # generated API tests
 |--.env                    # local environment configuration
 |--package.json            # application scripts and dependencies
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
      "routes": "[0 or more of 'get','post','put','delete','search']",
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
 - The model level `routes` array controls which CRUD endpoints are generated. It defaults to all supported actions.
 - The model level `authentication` (Array of Action Names) property specifies the API endpoints that require authentication to access. If you don't want authentication added, this key needs to be removed or left as an empty array.
 - Timestamp attributes, i.e. `createdAt` and `updatedAt` are automatically added to all models.
 - Only `name` and `directory` are required. Repository metadata, configuration, authentication, models, attributes, relations, and route lists have defaults.

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
    {"name": "HTTP_PORT", "value": 8000, "comment": "HTTP port"},
    {"name": "MONGODB_URL", "value":"mongodb://127.0.0.1:27017/[app-name]", "comment": "MongoDB URL"},
    {"name": "SALT_LENGTH", "value": 12, "comment": "Password hash rounds"},
    {"name": "JWT_KEY", "value":"change-me", "comment": "JWT signing secret"},
    {"name": "MAX_PAGE_SIZE", "value": 100, "comment": "Maximum search page size"},
    {"name": "DEFAULT_SORT", "value":"-updatedAt", "comment": "Default sort"}
  ],
  "models": [
    {
      "name": "",
      "authentication": ["get","post","put","delete","search"],
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

### Minimal settings

Only the application name and output directory are required. Authentication is
disabled, the model list is empty, repository metadata is blank, and common
environment settings receive defaults:

```json
{
  "name": "movies-api",
  "directory": "./movies-api"
}
```

Settings are validated with Zod before any files are generated. Invalid fields
are reported together, so generation never starts with a partially valid
configuration.
