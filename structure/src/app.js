import express from "express";

import initializeRoutes from "./routes/index.js";
import { errorHandler, notFoundHandler } from "./middleware/errors.js";
import { requestLogger } from "./middleware/request-logger.js";
import { healthCheck } from "./routes/health.js";

const app = express();

app.use(requestLogger);
app.use(express.json());
app.get("/health", healthCheck);
initializeRoutes(app);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
