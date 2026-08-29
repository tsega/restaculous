import express from "express";

import initializeRoutes from "./routes/index.js";
import { errorHandler, notFoundHandler } from "./middleware/errors.js";

const app = express();

app.use(express.json());
initializeRoutes(app);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
