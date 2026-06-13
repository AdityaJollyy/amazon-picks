/**
 * Standard error shape thrown anywhere in the app.
 * The global error middleware turns this into a JSON response.
 */
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly success: false;
  public readonly errors: unknown[];

  constructor(
    statusCode: number,
    message = "Something went wrong",
    errors: unknown[] = []
  ) {
    super(message);
    this.statusCode = statusCode;
    this.success = false;
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }
}
