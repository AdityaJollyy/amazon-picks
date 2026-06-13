import { ApiError } from "@/lib/ApiError";
import type { ApiResponse } from "@/lib/ApiResponse";

const BASE_URL = import.meta.env.VITE_API_URL;

if (!BASE_URL) {
  throw new Error(
    "VITE_API_URL is not set. Add it to frontend/.env (e.g. VITE_API_URL=http://localhost:5000/api/v1)."
  );
}

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  /** Optional query params; values are stringified and URL-encoded. */
  query?: Record<string, string | number | boolean | undefined | null>;
  /** Bypass the JSON wrapper unwrap — useful for endpoints that return raw blobs. */
  raw?: boolean;
};

function buildUrl(path: string, query?: RequestOptions["query"]) {
  const url = new URL(
    path.startsWith("http") ? path : `${BASE_URL}${path.startsWith("/") ? path : `/${path}`}`
  );
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined || v === null) continue;
      url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, query, headers, raw, ...rest } = options;

  const isJsonBody = body !== undefined && !(body instanceof FormData);
  const finalHeaders = new Headers(headers);
  if (isJsonBody && !finalHeaders.has("Content-Type")) {
    finalHeaders.set("Content-Type", "application/json");
  }
  if (!finalHeaders.has("Accept")) {
    finalHeaders.set("Accept", "application/json");
  }

  let res: Response;
  try {
    res = await fetch(buildUrl(path, query), {
      ...rest,
      headers: finalHeaders,
      body:
        body === undefined
          ? undefined
          : body instanceof FormData
            ? body
            : JSON.stringify(body),
    });
  } catch (err) {
    // Network failure (server down, DNS, CORS preflight, offline)
    throw new ApiError(
      0,
      err instanceof Error ? `Network error: ${err.message}` : "Network error"
    );
  }

  // Try to parse JSON regardless of status — backend errors are JSON too.
  const text = await res.text();
  let payload: unknown = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      // Non-JSON response (HTML error page, etc.)
      payload = null;
    }
  }

  if (!res.ok) {
    const p = payload as Partial<ApiResponse> & { errors?: unknown[] } | null;
    throw new ApiError(
      res.status,
      p?.message ?? res.statusText ?? "Request failed",
      p?.errors ?? []
    );
  }

  if (raw) return payload as T;

  // Unwrap ApiResponse<T> -> T
  const wrapped = payload as ApiResponse<T> | null;
  if (wrapped && typeof wrapped === "object" && "data" in wrapped) {
    return wrapped.data;
  }
  return payload as T;
}

export const apiClient = {
  get: <T>(path: string, options?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(path, { ...options, method: "GET" }),
  post: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(path, { ...options, method: "POST", body }),
  put: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(path, { ...options, method: "PUT", body }),
  patch: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(path, { ...options, method: "PATCH", body }),
  delete: <T>(path: string, options?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(path, { ...options, method: "DELETE" }),
};

export type { RequestOptions };
