import type { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError.js";

/** Catch-all error handler. Must be registered LAST in app.ts. */
export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
) => {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors,
    });
    return;
  }

  console.error("Unhandled error:", err);
  res.status(500).json({
    success: false,
    message: "Internal Server Error",
    errors: [],
  });
};

/** Handles any route that wasn't matched. */
export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
    errors: [],
  });
};
