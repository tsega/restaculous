import express from "express";

import initializeRoutes from "./routes/index.js";
import { errorHandler, notFoundHandler } from "./middleware/errors.js";
import { requestLogger } from "./middleware/request-logger.js";

const app = express();

app.use(requestLogger);
app.use(express.json());
initializeRoutes(app);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
