import { afterEach, describe, expect, it, vi } from "vitest";
import type { Reservation } from "@/lib/api/types";
import { buildManageUrl, parseManageHash, shortReference } from "@/lib/manage-link";
import {
  findStoredReservation,
  listStoredReservations,
  removePastReservations,
  saveReservation,
  STORAGE_KEY,
  updateStoredStatus,
} from "@/lib/reservation-storage";

const reservation = (overrides: Partial<Reservation> = {}): Reservation => ({
  reference: "0afd8af6-ba21-49eb-b53a-f61ceb0d4105",
  status: "confirmed",
  date: "2026-10-20",
  time: "20:30",
  party_size: 2,
  starts_at: "2026-10-20T20:30:00+02:00",
  ends_at: "2026-10-20T21:30:00+02:00",
  first_name: "Mario",
  last_name: "Rossi",
  phone: "333 123 4567",
  email: null,
  notes: null,
  cancelled_at: null,
  ...overrides,
});

describe("archivio locale", () => {
  afterEach(() => vi.restoreAllMocks());

  it("salva con la chiave versionata e solo i campi previsti", () => {
    expect(saveReservation(reservation(), "token123")).toBe(true);
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(raw).toHaveLength(1);
    expect(Object.keys(raw[0]).sort()).toEqual(
      ["date", "ends_at", "first_name", "party_size", "reference", "savedAt", "starts_at", "status", "time", "token"].sort(),
    );
    expect(raw[0]).not.toHaveProperty("phone");
  });

  it("aggiorna lo stato e rimuove le passate", () => {
    saveReservation(reservation(), "t1");
    saveReservation(reservation({ reference: "old", date: "2026-10-01" }), "t2");
    updateStoredStatus(reservation().reference, "cancelled");
    expect(findStoredReservation(reservation().reference)?.status).toBe("cancelled");
    removePastReservations(new Date("2026-10-16T08:00:00Z"));
    expect(listStoredReservations().map((item) => item.reference)).toEqual([reservation().reference]);
  });

  it("ignora contenuti corrotti", () => {
    localStorage.setItem(STORAGE_KEY, "{non json");
    expect(listStoredReservations()).toEqual([]);
    localStorage.setItem(STORAGE_KEY, JSON.stringify([{ foo: 1 }, "x"]));
    expect(listStoredReservations()).toEqual([]);
  });

  it("funziona in memoria quando lo storage è bloccato (navigazione privata)", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("QuotaExceededError");
    });
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("SecurityError");
    });
    expect(() => saveReservation(reservation(), "t1")).not.toThrow();
    expect(saveReservation(reservation(), "t1")).toBe(false);
    expect(findStoredReservation(reservation().reference)?.token).toBe("t1");
  });
});

describe("link di gestione", () => {
  it("mette riferimento e token solo nel frammento", () => {
    const url = buildManageUrl("https://app.anticoburger.it", "abc-123", "tok");
    expect(url).toBe("https://app.anticoburger.it/prenotazione#ref=abc-123&token=tok");
    expect(new URL(url).search).toBe("");
    expect(parseManageHash(new URL(url).hash)).toEqual({ reference: "abc-123", token: "tok" });
    expect(parseManageHash("")).toEqual({ reference: null, token: null });
    expect(parseManageHash("#ref=abc")).toEqual({ reference: "abc", token: null });
  });

  it("produce il riferimento breve", () => {
    expect(shortReference("0afd8af6-ba21-49eb-b53a-f61ceb0d4105")).toBe("0AFD8AF6");
  });
});
