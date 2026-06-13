import type { Request, Response, NextFunction, RequestHandler } from "express";

/**
 * Wraps an async controller so any thrown error / rejected promise is
 * forwarded to the global error middleware instead of crashing the process.
 * Keeps every controller free of repetitive try/catch (DRY).
 */
export const asyncHandler = (
  handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
): RequestHandler => {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
};
