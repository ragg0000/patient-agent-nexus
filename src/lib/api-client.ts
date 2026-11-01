/**
 * Reusable API client for the FastAPI backend.
 *
 * - JSON request handling, multipart audio upload, typed responses
 * - timeout handling and user-friendly typed errors
 * - backend health check
 *
 * No API keys live in frontend code. The backend URL comes from VITE_API_BASE_URL.
 */

export type ApiErrorKind = "network" | "timeout" | "not-found" | "server" | "invalid";

export class ApiError extends Error {
  kind: ApiErrorKind;
  status?: number | undefined;

  constructor(kind: ApiErrorKind, message: string, status?: number | undefined) {
    super(message);
    this.name = "ApiError";
    this.kind = kind;
    this.status = status;
  }
}

export const DEFAULT_API_BASE_URL = "http://localhost:8000/api";

export function apiBaseUrl(): string {
  return import.meta.env["VITE_API_BASE_URL"] ?? DEFAULT_API_BASE_URL;
}

type RequestOptions = {
  method?: string | undefined;
  json?: unknown;
  form?: FormData | undefined;
  timeoutMs?: number | undefined;
};

const DEFAULT_TIMEOUT_MS = 15_000;

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  const init: RequestInit = { method: options.method ?? "GET", signal: controller.signal };
  if (options.json !== undefined) {
    init.headers = { "Content-Type": "application/json" };
    init.body = JSON.stringify(options.json);
  } else if (options.form) {
    init.body = options.form;
  }
  try {
    const res = await fetch(`${apiBaseUrl()}${path}`, init);

    if (res.status === 404) {
      throw new ApiError("not-found", "That item was not found on the backend.", 404);
    }
    if (!res.ok) {
      throw new ApiError("server", `The backend returned an error (${res.status}).`, res.status);
    }

    const text = await res.text();
    if (!text) return undefined as T;
    try {
      return JSON.parse(text) as T;
    } catch {
      throw new ApiError("invalid", "The backend returned a response that could not be parsed.");
    }
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new ApiError("timeout", "The backend took too long to respond. Please retry.");
    }
    throw new ApiError(
      "network",
      "Cannot reach the backend. Check the connection and retry, or use the offline fallback.",
    );
  } finally {
    clearTimeout(timer);
  }
}

export const api = {
  get: <T>(path: string, timeoutMs?: number | undefined) => request<T>(path, { timeoutMs }),
  post: <T>(path: string, json?: unknown, timeoutMs?: number | undefined) =>
    request<T>(path, { method: "POST", json, timeoutMs }),
  postForm: <T>(path: string, form: FormData, timeoutMs?: number | undefined) =>
    request<T>(path, { method: "POST", form, timeoutMs }),
};

export type HealthStatus = { ok: boolean; detail?: string | undefined };

export async function checkHealth(): Promise<HealthStatus> {
  try {
    const result = await api.get<unknown>("/health", 5000);
    return { ok: true, detail: typeof result === "string" ? result : undefined };
  } catch (error) {
    return { ok: false, detail: error instanceof ApiError ? error.message : "Backend unavailable." };
  }
}

/** Short, user-friendly label for an error, suitable for retry panels. */
export function describeApiError(error: unknown): { title: string; detail: string } {
  if (error instanceof ApiError) {
    const titles: Record<ApiErrorKind, string> = {
      network: "Backend unavailable",
      timeout: "Request timed out",
      "not-found": "Not found",
      server: "Backend error",
      invalid: "Invalid response",
    };
    return { title: titles[error.kind], detail: error.message };
  }
  return { title: "Unexpected error", detail: error instanceof Error ? error.message : String(error) };
}
