/**
 * Frontend mirror of the backend ApiError. Thrown by apiClient on any
 * non-2xx response, so feature code can `catch (e instanceof ApiError)`
 * and surface `e.message` / `e.statusCode` directly.
 */
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly errors: unknown[];

  constructor(
    statusCode: number,
    message = "Something went wrong",
    errors: unknown[] = []
  ) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.errors = errors;
  }
}
