/**
 * Mirror of the backend's ApiResponse class. Every backend response that
 * isn't a thrown ApiError follows this shape, so we type it once on the
 * client and the apiClient unwraps `.data` for callers.
 */
export type ApiResponse<T = unknown> = {
  statusCode: number;
  data: T;
  message: string;
  success: boolean;
};
