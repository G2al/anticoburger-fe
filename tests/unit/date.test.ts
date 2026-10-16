import { describe, expect, it } from "vitest";
import {
  addDays,
  addMonths,
  calendarMonthRange,
  formatInstant,
  formatLongDate,
  formatMonth,
  formatTimeOfInstant,
  isPast,
  todayInRome,
  weekdayIndex,
} from "@/lib/date";

describe("date utils (Europe/Rome)", () => {
  it("il dispositivo dei test è in un altro fuso", () => {
    expect(Intl.DateTimeFormat().resolvedOptions().timeZone).toBe("America/Los_Angeles");
  });

  it("calcola 'oggi' a Roma anche quando sul dispositivo è ancora ieri", () => {
    // 23:30 UTC del 15/10 = 01:30 del 16/10 a Roma (CEST), 16:30 del 15/10 a Los Angeles.
    expect(todayInRome(new Date("2026-10-15T23:30:00Z"))).toBe("2026-10-16");
  });

  it("gestisce il cambio d'ora del 25/10/2026", () => {
    // 22:30 UTC del 24/10 = 00:30 del 25/10 (ancora +02:00).
    expect(todayInRome(new Date("2026-10-24T22:30:00Z"))).toBe("2026-10-25");
    // 23:30 UTC del 25/10 = 00:30 del 26/10 (ora +01:00).
    expect(todayInRome(new Date("2026-10-25T23:30:00Z"))).toBe("2026-10-26");
    expect(todayInRome(new Date("2026-10-25T22:30:00Z"))).toBe("2026-10-25");
    expect(addDays("2026-10-24", 1)).toBe("2026-10-25");
    expect(addDays("2026-10-25", 1)).toBe("2026-10-26");
    expect(formatLongDate("2026-10-25")).toBe("Domenica 25 ottobre");
    expect(formatTimeOfInstant("2026-10-25T20:30:00+01:00")).toBe("20:30");
    expect(formatTimeOfInstant("2026-10-24T20:30:00+02:00")).toBe("20:30");
  });

  it("formatta date senza slittare di un giorno", () => {
    expect(formatLongDate("2026-10-20")).toBe("Martedì 20 ottobre");
    expect(formatLongDate("2026-01-01", { withYear: true })).toBe("Giovedì 1 gennaio 2026");
    expect(formatMonth("2026-10")).toBe("Ottobre 2026");
    expect(weekdayIndex("2026-10-19")).toBe(0); // lunedì
    expect(weekdayIndex("2026-10-25")).toBe(6); // domenica
  });

  it("formatta istanti con offset nell'ora di Roma", () => {
    expect(formatInstant("2026-10-16T08:05:00Z")).toBe("16 ottobre 2026 alle ore 10:05");
    expect(formatInstant("2026-12-01T19:00:00+01:00")).toBe("1 dicembre 2026 alle ore 19:00");
  });

  it("aggiunge mesi attraverso l'anno", () => {
    expect(addMonths("2026-12", 1)).toBe("2027-01");
    expect(addMonths("2026-10", 12)).toBe("2027-10");
    expect(addMonths("2026-01", -1)).toBe("2025-12");
  });

  it("limita la navigazione del calendario a max_advance_days e a 12 mesi", () => {
    const now = new Date("2026-10-16T08:00:00Z");
    expect(calendarMonthRange(30, now)).toEqual({ first: "2026-10", last: "2026-11" });
    expect(calendarMonthRange(0, now)).toEqual({ first: "2026-10", last: "2027-10" });
    expect(calendarMonthRange(1000, now)).toEqual({ first: "2026-10", last: "2027-10" });
  });

  it("riconosce le prenotazioni passate nell'ora di Roma", () => {
    const now = new Date("2026-10-16T18:00:00Z"); // 20:00 a Roma
    expect(isPast("2026-10-16", "19:30", now)).toBe(true);
    expect(isPast("2026-10-16", "20:30", now)).toBe(false);
    expect(isPast("2026-10-17", "12:00", now)).toBe(false);
  });
});
