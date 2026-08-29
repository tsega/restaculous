# Generated REST API

Application code lives in `src/`. `src/app.js` creates the Express application
without opening a port, while `src/server.js` connects to MongoDB and starts the
server. This separation keeps HTTP tests independent from server startup.

Controllers use Mongoose models directly for ordinary CRUD operations. The
`services/` directory is reserved for business operations that coordinate more
than basic persistence, such as authentication.

```sh
npm start
npm test
```

## Health monitoring

`GET /health` returns `{ "status": "ok" }` when the application process is
running. It is public, contains no system or configuration details, and does
not query MongoDB. This makes it suitable as a lightweight liveness check;
database readiness should be monitored separately when a deployment requires
it.

## Configuration

Copy `.env.example` to `.env` and provide values appropriate for the current
environment. The application validates required values and numeric ranges at
startup, then exits with a clear error if configuration is invalid.

- `HTTP_PORT`: server port from 1 to 65535; defaults to `8000`
- `MONGODB_URL`: required MongoDB connection URL
- `TEST_MONGODB_URL`: required, separate MongoDB URL used only by tests
- `SALT_LENGTH`: positive integer used for password hashing; defaults to `12`
- `JWT_KEY`: required signing secret when authentication is generated
- `MAX_PAGE_SIZE`: positive maximum number of search results; defaults to `100`
- `DEFAULT_SORT`: default Mongoose sort expression; defaults to `-updatedAt`

Keep `.env` private. It is excluded from Git, while `.env.example` documents
the supported settings without including signing keys or other obvious secrets.

## Logging

The application uses a small console logger with timestamps and consistent
info, warning, and error levels. It records startup, database, shutdown, and
HTTP request events. Request logs contain only the method, path, status, and
duration; request bodies, query values, headers, and connection strings are not
logged. Internal errors are logged by the server but are not returned in
production-style HTTP error responses.

## Test database safety

Tests connect exclusively through `TEST_MONGODB_URL`; they never fall back to
`MONGODB_URL`. The test command refuses to run if the two URLs are equal. Test
files run serially, and generated test data is removed from the test database
before Mongoose disconnects. Always use a dedicated database because its data
is intentionally disposable.

When authentication is enabled, the generated suite also covers registration,
login, protected routes, rejected tokens, and the current-user endpoint.

## API documentation

Visit `/docs` for the generated API reference or download the OpenAPI 3.1
document from `/docs/openapi.json`. The static site has no runtime dependency or
build step and includes responsive endpoint navigation, search, light and dark
themes, request and response schemas, and copy controls.

Documentation is generated from `settings.json`. Set
`documentation.serverUrl` to the deployed API URL and
`documentation.accentColor` to a six-digit hexadecimal color. The generated
HTML, CSS, and browser JavaScript in `docs/` are intentionally human-readable
and can be customized directly after generation.
