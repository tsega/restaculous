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
