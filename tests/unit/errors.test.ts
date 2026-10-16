import { describe, expect, it } from "vitest";
import { ApiError, describeError, isTransientError } from "@/lib/api/errors";
import type { ErrorCode } from "@/lib/api/types";

const error = (code: ErrorCode, status = 422, extra: Partial<{ retryAfter: number }> = {}) =>
  new ApiError({ status, code, message: "testo del backend", ...extra });

describe("describeError", () => {
  it.each<[ErrorCode, number, string, string]>([
    ["SLOT_NOT_AVAILABLE", 409, "pick-time", "appena stato prenotato"],
    ["BOOKING_TOO_SOON", 422, "pick-time", "troppo vicino"],
    ["DATE_OUT_OF_RANGE", 422, "pick-date", "non è più prenotabile"],
    ["PARTY_SIZE_NOT_SUPPORTED", 422, "pick-party-size", "numero di persone"],
    ["DUPLICATE_RESERVATION", 409, "none", "prenotazione identica"],
    ["PHONE_DAILY_LIMIT_REACHED", 409, "contact", "numero massimo"],
    ["VALIDATION_FAILED", 422, "fix-fields", "campi evidenziati"],
    ["RESERVATION_NOT_FOUND", 404, "contact", "link non valido"],
    ["RESERVATION_TOKEN_MISSING", 401, "contact", "Link incompleto"],
    ["NETWORK_ERROR", 0, "retry", "Connessione"],
    ["TIMEOUT", 0, "retry", "non ha risposto"],
    ["SERVER_ERROR", 500, "retry", "non è momentaneamente disponibile"],
    ["INVALID_RESPONSE", 502, "retry", "non è momentaneamente disponibile"],
  ])("%s → %s", (code, status, action, text) => {
    const info = describeError(error(code, status));
    expect(info.action).toBe(action);
    expect(info.message).toContain(text);
    // Mai il testo del backend: si basa solo sul codice.
    expect(info.message).not.toContain("testo del backend");
  });

  it("usa Retry-After nel messaggio dei 429", () => {
    expect(describeError(error("TOO_MANY_REQUESTS", 429, { retryAfter: 12 })).message).toBe(
      "Troppe richieste. Riprova tra 12 secondi.",
    );
    expect(describeError(error("TOO_MANY_REQUESTS", 429, { retryAfter: 1 })).message).toContain("1 secondo.");
    expect(describeError(error("TOO_MANY_REQUESTS", 429)).message).toContain("qualche istante");
  });

  it("gestisce errori sconosciuti", () => {
    expect(describeError(new Error("boom")).code).toBe("UNKNOWN");
  });
});

describe("isTransientError", () => {
  it("ritenta solo rete, timeout e 5xx", () => {
    expect(isTransientError(error("NETWORK_ERROR", 0))).toBe(true);
    expect(isTransientError(error("TIMEOUT", 0))).toBe(true);
    expect(isTransientError(error("SERVER_ERROR", 500))).toBe(true);
    expect(isTransientError(error("INVALID_RESPONSE", 503))).toBe(true);
    expect(isTransientError(error("TOO_MANY_REQUESTS", 429))).toBe(false);
    expect(isTransientError(error("VALIDATION_FAILED", 422))).toBe(false);
    expect(isTransientError(error("SLOT_NOT_AVAILABLE", 409))).toBe(false);
  });
});
