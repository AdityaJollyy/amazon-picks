import express from "express";
import cors from "cors";
import apiRoutes from "./routes/index.js";
import {
  errorHandler,
  notFoundHandler,
} from "./middlewares/error.middleware.js";

const app = express();

app.use(cors());
app.use(express.json());

// All API routes are versioned under /api/v1
app.use("/api/v1", apiRoutes);

// 404 + error handlers go last
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
