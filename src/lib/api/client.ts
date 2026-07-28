/**
 * Cooplink API client.
 *
 * NOTE: this is a swappable stub. Endpoint paths, request/response shapes,
 * auth header format, pagination envelope, and error format will all be
 * replaced 1:1 from the API docs once provided. UI code should NOT need to
 * change when that happens — only this file, `types.ts`, and the files
 * under `endpoints/` will.
 *
 * Everything in `endpoints/` currently throws NotImplementedError. That is
 * intentional — the UI must render real loading/error/empty states rather
 * than pretend to have data.
 */

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "/api";

const AUTH_TOKEN_KEY = "cooplink.auth_token";

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setAuthToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(AUTH_TOKEN_KEY, token);
  else window.localStorage.removeItem(AUTH_TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  code: string;
  details?: unknown;
  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export class NotImplementedError extends ApiError {
  constructor(endpoint: string) {
    super(
      501,
      "not_implemented",
      `Endpoint '${endpoint}' is not wired yet. Attach API docs to complete the client.`,
    );
    this.name = "NotImplementedError";
  }
}

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
  signal?: AbortSignal;
  auth?: boolean;
}

function buildUrl(path: string, query?: RequestOptions["query"]): string {
  const url = new URL(path.startsWith("http") ? path : `${API_BASE}${path}`, typeof window !== "undefined" ? window.location.origin : "http://localhost");
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined || v === null || v === "") continue;
      url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

export async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, query, signal, auth = true } = opts;

  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (auth) {
    const token = getAuthToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(buildUrl(path, query), {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    signal,
    credentials: "include",
  });

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const payload = isJson ? await res.json().catch(() => null) : await res.text().catch(() => null);

  if (!res.ok) {
    const err = payload as { code?: string; message?: string; details?: unknown } | null;
    throw new ApiError(
      res.status,
      err?.code ?? `http_${res.status}`,
      err?.message ?? res.statusText ?? "Request failed",
      err?.details,
    );
  }

  return payload as T;
}

/** Pagination envelope — replace shape once API docs land. */
export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
}
