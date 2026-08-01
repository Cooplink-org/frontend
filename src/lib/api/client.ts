const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "/api";

const ACCESS_TOKEN_KEY = "cooplink_access_token";
const REFRESH_TOKEN_KEY = "cooplink_refresh_token";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setAccessToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
  else window.localStorage.removeItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setRefreshToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(REFRESH_TOKEN_KEY, token);
  else window.localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function clearTokens() {
  setAccessToken(null);
  setRefreshToken(null);
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

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
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

export async function refreshTokens(): Promise<boolean> {
  const refresh = getRefreshToken();
  if (!refresh) return false;
  try {
    const res = await fetch(buildUrl("/token/refresh/"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });
    if (!res.ok) {
      clearTokens();
      return false;
    }
    const data = await res.json();
    setAccessToken(data.access);
    if (data.refresh) setRefreshToken(data.refresh);
    return true;
  } catch {
    clearTokens();
    return false;
  }
}

export async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = "GET", body: rawBody, query, signal, auth = true } = opts;

  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (rawBody !== undefined) headers["Content-Type"] = "application/json";
  if (auth) {
    const token = getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const body = rawBody === undefined ? undefined : JSON.stringify(rawBody);

  let res = await fetch(buildUrl(path, query), { method, headers, body, signal });

  if (res.status === 401 && auth) {
    const refreshed = await refreshTokens();
    if (refreshed) {
      const newToken = getAccessToken();
      if (newToken) headers.Authorization = `Bearer ${newToken}`;
      res = await fetch(buildUrl(path, query), { method, headers, body, signal });
    }
  }

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const payload = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    let message = res.statusText || "Request failed";
    let details: unknown = undefined;
    if (payload && typeof payload === "object") {
      if (typeof payload.detail === "string") {
        message = payload.detail;
      } else {
        const fieldErrors = Object.entries(payload)
          .filter(([, v]) => Array.isArray(v))
          .map(([k, v]) => `${k}: ${(v as string[]).join(", ")}`)
          .join("; ");
        if (fieldErrors) message = fieldErrors;
        details = payload;
      }
    }
    throw new ApiError(res.status, `http_${res.status}`, message, details);
  }

  return payload as T;
}

function camelize(str: string): string {
  return str.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

export function mapKeys<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  if (!obj || typeof obj !== "object") return obj as unknown as Record<string, unknown>;
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    result[camelize(k)] = v;
  }
  return result;
}