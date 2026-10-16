import { http, HttpResponse } from "msw";
import { afterEach, describe, expect, it, vi } from "vitest";
import { apiRequest, parseRetryAfter } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import { API } from "../msw/fixtures";
import { server } from "../msw/server";

async function catchError(promise: Promise<unknown>): Promise<ApiError> {
  try {
    await promise;
  } catch (error) {
    return error as ApiError;
  }
  throw new Error("La richiesta doveva fallire");
}

describe("apiRequest", () => {
  afterEach(() => vi.restoreAllMocks());

  it("restituisce data e invia gli header previsti senza credenziali", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    server.use(http.get(`${API}/booking-settings`, () => HttpResponse.json({ data: { ok: true } })));
    await expect(apiRequest("/booking-settings")).resolves.toEqual({ ok: true });
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe(`${API}/booking-settings`);
    expect(init).toMatchObject({ method: "GET", credentials: "omit", headers: { Accept: "application/json" } });
    expect((init?.headers as Record<string, string>)["Content-Type"]).toBeUndefined();
  });

  it("invia il token solo nell'header X-Reservation-Token", async () => {
    let captured: Request | undefined;
    server.use(
      http.post(`${API}/reservations/abc/cancel`, ({ request }) => {
        captured = request;
        return HttpResponse.json({ data: {} });
      }),
    );
    await apiRequest("/reservations/abc/cancel", { method: "POST", token: "segreto" });
    expect(captured?.headers.get("X-Reservation-Token")).toBe("segreto");
    expect(captured?.url).not.toContain("segreto");
  });

  it("trasforma l'envelope di errore in ApiError con fields", async () => {
    server.use(
      http.post(`${API}/reservations`, () =>
        HttpResponse.json(
          { error: { code: "VALIDATION_FAILED", message: "I dati inviati non sono validi.", fields: { phone: ["x"] } } },
          { status: 422 },
        ),
      ),
    );
    const error = await catchError(apiRequest("/reservations", { method: "POST", body: {} }));
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 422, code: "VALIDATION_FAILED", fields: { phone: ["x"] } });
  });

  it("legge Retry-After sui 429", async () => {
    server.use(
      http.get(`${API}/calendar`, () =>
        HttpResponse.json(
          { error: { code: "TOO_MANY_REQUESTS", message: "Troppe richieste. Riprova tra poco." } },
          { status: 429, headers: { "Retry-After": "42" } },
        ),
      ),
    );
    const error = await catchError(apiRequest("/calendar"));
    expect(error).toMatchObject({ status: 429, code: "TOO_MANY_REQUESTS", retryAfter: 42 });
  });

  it("gestisce corpi non JSON (HTML di un proxy 502)", async () => {
    server.use(
      http.get(`${API}/booking-settings`, () => new HttpResponse("<html>Bad gateway</html>", { status: 502 })),
    );
    const error = await catchError(apiRequest("/booking-settings"));
    expect(error).toMatchObject({ status: 502, code: "INVALID_RESPONSE" });
  });

  it("gestisce il JSON di debug di Laravel (500 senza envelope)", async () => {
    server.use(
      http.get(`${API}/booking-settings`, () =>
        HttpResponse.json({ message: "Server Error", exception: "Error", trace: [] }, { status: 500 }),
      ),
    );
    const error = await catchError(apiRequest("/booking-settings"));
    expect(error).toMatchObject({ status: 500, code: "INVALID_RESPONSE" });
  });

  it("rifiuta un 200 senza envelope", async () => {
    server.use(http.get(`${API}/booking-settings`, () => HttpResponse.json({ ok: true })));
    const error = await catchError(apiRequest("/booking-settings"));
    expect(error.code).toBe("INVALID_RESPONSE");
  });

  it("segnala NETWORK_ERROR per errori di rete o CORS", async () => {
    server.use(http.get(`${API}/booking-settings`, () => HttpResponse.error()));
    const error = await catchError(apiRequest("/booking-settings"));
    expect(error).toMatchObject({ status: 0, code: "NETWORK_ERROR" });
  });

  it("segnala TIMEOUT quando il server non risponde in tempo", async () => {
    server.use(
      http.get(`${API}/booking-settings`, async () => {
        await new Promise((resolve) => setTimeout(resolve, 500));
        return HttpResponse.json({ data: {} });
      }),
    );
    const error = await catchError(apiRequest("/booking-settings", { timeoutMs: 50 }));
    expect(error).toMatchObject({ status: 0, code: "TIMEOUT" });
  });

  it("non registra mai nulla in console", async () => {
    const log = vi.spyOn(console, "log");
    const warn = vi.spyOn(console, "warn");
    const errorLog = vi.spyOn(console, "error");
    server.use(http.get(`${API}/reservations/abc`, () => HttpResponse.error()));
    await catchError(apiRequest("/reservations/abc", { token: "segreto" }));
    expect(log).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
    expect(errorLog).not.toHaveBeenCalled();
  });
});

describe("parseRetryAfter", () => {
  it("accetta secondi e date HTTP", () => {
    expect(parseRetryAfter("30")).toBe(30);
    expect(parseRetryAfter(null)).toBeUndefined();
    expect(parseRetryAfter("Fri, 16 Oct 2026 08:01:00 GMT", Date.parse("2026-10-16T08:00:00Z"))).toBe(60);
    expect(parseRetryAfter("boh")).toBeUndefined();
  });
});
