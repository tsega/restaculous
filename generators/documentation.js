import fs from "fs-extra";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pluralize from "pluralize";

const sourceDirectory = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../documentation"
);

export function generate(settings, callback) {
  generateDocumentation(settings).then(() => callback(null), callback);
}

async function generateDocumentation(settings) {
  const outputDirectory = path.join(settings.directory, "docs");
  await fs.copy(sourceDirectory, outputDirectory);
  await fs.writeJson(
    path.join(outputDirectory, "openapi.json"),
    buildOpenApiDocument(settings),
    { spaces: 2 }
  );
}

export function buildOpenApiDocument(settings) {
  const document = {
    openapi: "3.1.0",
    info: {
      title: settings.name,
      version: settings.version,
      description: settings.description || `API documentation for ${settings.name}`
    },
    servers: [{ url: settings.documentation.serverUrl }],
    tags: [{ name: "Health", description: "Application monitoring" }, ...settings.models.map((model) => ({
      name: model.name,
      description: `${model.name} operations`
    }))],
    paths: {
      "/health": {
        get: operation("Health", "Check application liveness", "healthCheck", {
          responses: { "200": jsonResponse("Application is running", simpleSchema({ status: { type: "string", example: "ok" } })) }
        })
      }
    },
    components: {
      securitySchemes: settings.authentication ? {
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" }
      } : {},
      schemas: {
        Error: simpleSchema({ error: { type: "string" } }),
        ValidationError: simpleSchema({ errors: { type: "array", items: { type: "object" } } })
      },
      responses: commonResponses()
    },
    "x-docs": {
      accentColor: settings.documentation.accentColor,
      repository: settings.repository.url
    }
  };

  for (const model of settings.models) {
    addModelSchemas(document, model);
    addModelPaths(document, model);
  }
  if (settings.authentication) {
    addAuthenticationDocumentation(document);
  }
  validateOpenApiDocument(document);
  return document;
}

export function validateOpenApiDocument(document) {
  if (document.openapi !== "3.1.0") throw new Error("OpenAPI version must be 3.1.0");
  if (!document.info?.title || !document.info?.version) throw new Error("OpenAPI info is incomplete");
  if (!document.paths || !document.components?.schemas) throw new Error("OpenAPI paths and schemas are required");
  const operationIds = new Set();
  for (const [route, pathItem] of Object.entries(document.paths)) {
    if (!route.startsWith("/")) throw new Error(`OpenAPI path must start with /: ${route}`);
    for (const [method, operation] of Object.entries(pathItem)) {
      if (!operation.operationId || !operation.responses) {
        throw new Error(`OpenAPI ${method.toUpperCase()} ${route} is incomplete`);
      }
      if (operationIds.has(operation.operationId)) {
        throw new Error(`OpenAPI operationId must be unique: ${operation.operationId}`);
      }
      operationIds.add(operation.operationId);
    }
  }
  const references = JSON.stringify(document).match(/#\/components\/[A-Za-z]+\/[A-Za-z0-9]+/g) ?? [];
  for (const reference of references) {
    const value = reference.slice(2).split("/").reduce((current, key) => current?.[key], document);
    if (!value) throw new Error(`OpenAPI reference does not exist: ${reference}`);
  }
  return document;
}

function addModelSchemas(document, model) {
  const responseProperties = {};
  const requestProperties = {};
  const required = [];
  for (const attribute of model.attributes) {
    const schema = attributeSchema(attribute);
    if (!attribute.isAuto) requestProperties[attribute.name] = schema;
    if (!attribute.isPrivate) responseProperties[attribute.name] = schema;
    if (!attribute.isAuto && attribute.validation.some(({ type }) => type === "notEmpty")) required.push(attribute.name);
  }
  Object.assign(responseProperties, {
    _id: { type: "string", description: `${model.name} ID` },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" }
  });
  for (const relation of model.relations) {
    const property = relation.name.toLowerCase();
    responseProperties[relation.referenceType === "multiple" ? pluralize(property) : property] =
      relation.referenceType === "multiple"
        ? { type: "array", items: { type: "string", description: `${relation.name} ID` } }
        : { type: "string", description: `${relation.name} ID` };
    requestProperties[relation.referenceType === "multiple" ? pluralize(property) : property] =
      responseProperties[relation.referenceType === "multiple" ? pluralize(property) : property];
  }
  document.components.schemas[model.name] = objectSchema(responseProperties, required.filter((name) => responseProperties[name]));
  document.components.schemas[`${model.name}Create`] = objectSchema(requestProperties, required);
  document.components.schemas[`${model.name}Update`] = objectSchema(requestProperties);
}

function addModelPaths(document, model) {
  const plural = pluralize(model.name.toLowerCase());
  const idName = `${model.name.toLowerCase()}Id`;
  const collection = `/${plural}`;
  const item = `${collection}/{${idName}}`;
  const secured = (action) => model.authentication.includes(action) ? [{ bearerAuth: [] }] : undefined;
  const refs = { response: schemaRef(model.name), create: schemaRef(`${model.name}Create`), update: schemaRef(`${model.name}Update`) };

  if (model.routes.includes("post")) setOperation(document, collection, "post", operation(model.name, `Create a ${model.name}`, `create${model.name}`, { security: secured("post"), requestBody: requestBody(refs.create, true), responses: successResponses("201", `${model.name} created`, refs.response, true) }));
  if (model.routes.includes("search")) setOperation(document, `${collection}/search`, "get", operation(model.name, `Search ${plural}`, `search${pluralize(model.name)}`, { security: secured("search"), parameters: searchParameters(), responses: successResponses("200", `${model.name} results`, searchSchema(refs.response)) }));
  if (model.routes.includes("get")) setOperation(document, item, "get", operation(model.name, `Get a ${model.name}`, `get${model.name}`, { security: secured("get"), parameters: [idParameter(idName, model.name)], responses: successResponses("200", `${model.name} found`, refs.response) }));
  if (model.routes.includes("put")) setOperation(document, item, "put", operation(model.name, `Update a ${model.name}`, `update${model.name}`, { security: secured("put"), parameters: [idParameter(idName, model.name)], requestBody: requestBody(refs.update), responses: successResponses("200", `${model.name} updated`, refs.response) }));
  if (model.routes.includes("delete")) setOperation(document, item, "delete", operation(model.name, `Delete a ${model.name}`, `delete${model.name}`, { security: secured("delete"), parameters: [idParameter(idName, model.name)], responses: successResponses("200", `${model.name} deleted`, refs.response) }));
}

function addAuthenticationDocumentation(document) {
  document.tags.push({ name: "Authentication", description: "User registration and JWT authentication" });
  document.components.schemas.User = objectSchema({ email: { type: "string", format: "email" }, createdAt: { type: "string", format: "date-time" }, updatedAt: { type: "string", format: "date-time" } }, ["email"]);
  document.components.schemas.Credentials = objectSchema({ email: { type: "string", format: "email" }, password: { type: "string", format: "password", minLength: 8 } }, ["email", "password"]);
  document.components.schemas.UserUpdate = objectSchema({ email: { type: "string", format: "email" } });
  setOperation(document, "/users", "post", operation("Authentication", "Register a user", "register", { requestBody: requestBody(schemaRef("Credentials"), true), responses: successResponses("201", "User registered", schemaRef("User"), true) }));
  setOperation(document, "/users/login", "post", operation("Authentication", "Log in", "login", { requestBody: requestBody(schemaRef("Credentials"), true), responses: successResponses("200", "Authentication successful", objectSchema({ message: { type: "string" }, token: { type: "string" } })) }));
  setOperation(document, "/users/me", "get", operation("Authentication", "Get the current user", "currentUser", { security: [{ bearerAuth: [] }], responses: successResponses("200", "Current user", schemaRef("User")) }));
  setOperation(document, "/users/search", "get", operation("Authentication", "Search users", "searchUsers", { security: [{ bearerAuth: [] }], parameters: searchParameters(), responses: successResponses("200", "User results", searchSchema(schemaRef("User"))) }));
  const userId = idParameter("userId", "User");
  setOperation(document, "/users/{userId}", "get", operation("Authentication", "Get a user", "getUser", { security: [{ bearerAuth: [] }], parameters: [userId], responses: successResponses("200", "User found", schemaRef("User")) }));
  setOperation(document, "/users/{userId}", "put", operation("Authentication", "Update a user", "updateUser", { security: [{ bearerAuth: [] }], parameters: [userId], requestBody: requestBody(schemaRef("UserUpdate")), responses: successResponses("200", "User updated", schemaRef("User"), true) }));
  setOperation(document, "/users/{userId}", "delete", operation("Authentication", "Delete a user", "deleteUser", { security: [{ bearerAuth: [] }], parameters: [userId], responses: successResponses("200", "User deleted", schemaRef("User")) }));
}

function attributeSchema(attribute) {
  const types = { String: "string", Number: "number", Boolean: "boolean", Date: "string" };
  const schema = { type: types[attribute.type] };
  if (attribute.type === "Date") schema.format = "date-time";
  if (attribute.desc) schema.description = attribute.desc;
  if (attribute.example !== "") schema.example = attribute.example;
  if (attribute.validation.length) schema["x-validation"] = attribute.validation;
  for (const validation of attribute.validation) {
    if (validation.type === "isEmail") schema.format = "email";
    if (validation.type === "isURL") schema.format = "uri";
    if (validation.type === "isInt") schema.type = "integer";
    if (validation.type === "isLength") Object.assign(schema, { minLength: validation.args[0].min, maxLength: validation.args[0].max });
  }
  return Object.fromEntries(Object.entries(schema).filter(([, value]) => value !== undefined));
}

function operation(tag, summary, operationId, details) { return { tags: [tag], summary, operationId, ...details }; }
function setOperation(document, route, method, value) { document.paths[route] ??= {}; document.paths[route][method] = value; }
function schemaRef(name) { return { $ref: `#/components/schemas/${name}` }; }
function objectSchema(properties, required = []) { return { type: "object", properties, ...(required.length ? { required } : {}) }; }
function simpleSchema(properties) { return objectSchema(properties); }
function requestBody(schema, required = false) { return { required, content: { "application/json": { schema } } }; }
function jsonResponse(description, schema) { return { description, content: { "application/json": { schema } } }; }
function successResponses(status, description, schema, validation = false) { return { [status]: jsonResponse(description, schema), ...(validation ? { "422": { $ref: "#/components/responses/ValidationError" } } : {}), "401": { $ref: "#/components/responses/AuthenticationError" }, "404": { $ref: "#/components/responses/NotFound" }, "500": { $ref: "#/components/responses/ServerError" } }; }
function commonResponses() { return { ValidationError: jsonResponse("Request validation failed", schemaRef("ValidationError")), AuthenticationError: jsonResponse("Authentication failed", schemaRef("Error")), NotFound: jsonResponse("Resource not found", schemaRef("Error")), ServerError: jsonResponse("Internal server error", schemaRef("Error")) }; }
function idParameter(name, model) { return { name, in: "path", required: true, description: `${model} ID`, schema: { type: "string" } }; }
function searchParameters() { return ["page", "limit", "sort", "fields", "filter"].map((name) => ({ name, in: "query", required: false, schema: { type: ["page", "limit"].includes(name) ? "integer" : "string" } })); }
function searchSchema(item) { return objectSchema({ options: { type: "object" }, result: { type: "array", items: item } }); }
