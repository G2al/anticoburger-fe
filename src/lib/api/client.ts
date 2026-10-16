import { getApiBaseUrl } from "@/lib/env";
import { ApiError } from "./errors";
import type { ApiErrorCode } from "./types";

export const READ_TIMEOUT_MS = 10_000;
export const WRITE_TIMEOUT_MS = 15_000;

type RequestOptions = {
  method?: "GET" | "POST";
  /** Corpo JSON (solo POST). */
  body?: unknown;
  /** Token di annullamento: viaggia solo nell'header X-Reservation-Token. */
  token?: string;
  /** Segnale esterno (es. TanStack Query) per annullare la richiesta. */
  signal?: AbortSignal;
  timeoutMs?: number;
};

/**
 * Unico punto di accesso HTTP alle API. Restituisce `data` dell'envelope `{ data }`
 * oppure lancia un `ApiError`. Non registra mai header, token o corpi di richiesta.
 */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, token, signal, timeoutMs = method === "GET" ? READ_TIMEOUT_MS : WRITE_TIMEOUT_MS } =
    options;

  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers["X-Reservation-Token"] = token;

  const timeout = new AbortController();
  const timer = setTimeout(() => timeout.abort(), timeoutMs);
  const onExternalAbort = () => timeout.abort();
  signal?.addEventListener("abort", onExternalAbort, { once: true });

  let response: Response;
  try {
    response = await fetch(`${getApiBaseUrl()}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: "omit",
      cache: "no-store",
      referrerPolicy: "no-referrer",
      signal: timeout.signal,
    });
  } catch (error) {
    // Annullamento voluto dal chiamante: lo si propaga così com'è.
    if (signal?.aborted) throw signal.reason ?? error;
    if (timeout.signal.aborted) {
      throw new ApiError({ status: 0, code: "TIMEOUT", message: "Timeout della richiesta." });
    }
    // TypeError: rete assente, DNS, CORS bloccato.
    throw new ApiError({ status: 0, code: "NETWORK_ERROR", message: "Errore di rete." });
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", onExternalAbort);
  }

  const payload = await readJson(response);

  if (response.ok) {
    if (isObject(payload) && "data" in payload) return payload.data as T;
    throw new ApiError({ status: response.status, code: "INVALID_RESPONSE", message: "Risposta non valida." });
  }

  const retryAfter = parseRetryAfter(response.headers.get("Retry-After"));

  if (isObject(payload) && isObject(payload.error) && typeof payload.error.code === "string") {
    const { code, message, fields } = payload.error;
    throw new ApiError({
      status: response.status,
      code: code as ApiErrorCode,
      message: typeof message === "string" ? message : "",
      fields: isObject(fields) ? (fields as Record<string, string[]>) : undefined,
      retryAfter,
    });
  }

  // Corpo non conforme: HTML di un proxy, JSON di debug di Laravel, corpo vuoto…
  throw new ApiError({
    status: response.status,
    code: response.status === 429 ? "TOO_MANY_REQUESTS" : "INVALID_RESPONSE",
    message: `Risposta HTTP ${response.status} non valida.`,
    retryAfter,
  });
}

async function readJson(response: Response): Promise<unknown> {
  try {
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Retry-After può essere in secondi o una data HTTP. */
export function parseRetryAfter(value: string | null, now = Date.now()): number | undefined {
  if (!value) return undefined;
  const seconds = Number(value.trim());
  if (Number.isFinite(seconds) && seconds >= 0) return Math.ceil(seconds);
  const date = Date.parse(value);
  if (Number.isNaN(date)) return undefined;
  return Math.max(0, Math.ceil((date - now) / 1000));
}
