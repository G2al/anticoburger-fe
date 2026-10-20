import { http, HttpResponse } from "msw";
import type { CreatedReservation, CreateReservationInput, Reservation } from "@/lib/api/types";
import { normalizePhone } from "@/lib/phone";
import { API, bookingHours, calendarFor, DEFAULT_SLOTS, menuFixture, settings } from "./fixtures";

// Simulazione del backend fedele al contratto (FRONTEND_HANDOFF.md): stesse forme e stessi codici.

type Stored = { reservation: Reservation; token: string };
export const db = {
  reservations: new Map<string, Stored>(),
  reset() {
    this.reservations.clear();
  },
};

export function apiError(status: number, code: string, message: string, extra: Record<string, unknown> = {}) {
  return HttpResponse.json({ error: { code, message, ...extra } }, { status });
}

let counter = 0;
function uuid() {
  counter += 1;
  return `0afd8af6-ba21-49eb-b53a-${String(counter).padStart(12, "0")}`;
}

function endsAt(date: string, time: string) {
  const [h, m] = time.split(":").map(Number);
  const end = `${String(h + 1).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  const offset = date >= "2026-10-25" ? "+01:00" : "+02:00";
  return { starts_at: `${date}T${time}:00${offset}`, ends_at: `${date}T${end}:00${offset}` };
}

export const handlers = [
  http.get(`${API}/booking-hours`, () => HttpResponse.json({ data: bookingHours })),
  http.get(`${API}/booking-settings`, () => HttpResponse.json({ data: settings })),

  http.get(`${API}/menu`, () =>
    HttpResponse.json({ data: menuFixture }, { headers: { "Cache-Control": "public, max-age=60" } }),
  ),

  http.get(`${API}/calendar`, ({ request }) => {
    const url = new URL(request.url);
    const month = url.searchParams.get("month") ?? "";
    const partySize = Number(url.searchParams.get("party_size"));
    if (month < "2026-10" || month > "2027-10") {
      return apiError(422, "MONTH_OUT_OF_RANGE", "Il mese selezionato non è consultabile.");
    }
    return HttpResponse.json({ data: calendarFor(month, partySize) });
  }),

  http.get(`${API}/availability`, ({ request }) => {
    const url = new URL(request.url);
    const date = url.searchParams.get("date") ?? "";
    const partySize = Number(url.searchParams.get("party_size"));
    if (date < "2026-10-16" || date > "2026-11-15") {
      return apiError(422, "DATE_OUT_OF_RANGE", "La data selezionata non è prenotabile.");
    }
    const status = calendarFor(date.slice(0, 7), partySize).days.find((day) => day.date === date)?.status;
    const slots = status === "available" && date !== "2026-10-29" ? DEFAULT_SLOTS : [];
    return HttpResponse.json({ data: { date, party_size: partySize, slots } });
  }),

  http.post(`${API}/reservations`, async ({ request }) => {
    const body = (await request.json()) as CreateReservationInput;
    const fields: Record<string, string[]> = {};
    if (!body.first_name?.trim()) fields.first_name = ["Il campo nome è obbligatorio."];
    if (!body.last_name?.trim()) fields.last_name = ["Il campo cognome è obbligatorio."];
    if (!body.phone || !normalizePhone(body.phone)) fields.phone = ["Il numero di telefono non è valido."];
    if (Object.keys(fields).length) {
      return apiError(422, "VALIDATION_FAILED", "I dati inviati non sono validi.", { fields });
    }
    const reference = uuid();
    const reservation: Reservation = {
      reference,
      status: "confirmed",
      date: body.date,
      time: body.time,
      party_size: body.party_size,
      ...endsAt(body.date, body.time),
      first_name: body.first_name.trim(),
      last_name: body.last_name.trim(),
      phone: body.phone,
      email: body.email ?? null,
      notes: body.notes ?? null,
      cancelled_at: null,
    };
    const token = "hS3IfT912aMyhYNryf9dAB7OvHjJikixWeBp4fQZd9H0IR4c";
    db.reservations.set(reference, { reservation, token });
    const created: CreatedReservation = { ...reservation, cancellation_token: token };
    return HttpResponse.json({ data: created }, { status: 201 });
  }),

  http.get(`${API}/reservations/:reference`, ({ request, params }) => {
    const token = request.headers.get("X-Reservation-Token");
    if (!token) {
      return apiError(401, "RESERVATION_TOKEN_MISSING", "Per accedere alla prenotazione è necessario il codice segreto.");
    }
    const stored = db.reservations.get(String(params.reference));
    if (!stored || stored.token !== token) return apiError(404, "RESERVATION_NOT_FOUND", "Prenotazione non trovata.");
    return HttpResponse.json({ data: stored.reservation });
  }),

  http.post(`${API}/reservations/:reference/cancel`, ({ request, params }) => {
    const token = request.headers.get("X-Reservation-Token");
    if (!token) {
      return apiError(401, "RESERVATION_TOKEN_MISSING", "Per accedere alla prenotazione è necessario il codice segreto.");
    }
    const stored = db.reservations.get(String(params.reference));
    if (!stored || stored.token !== token) return apiError(404, "RESERVATION_NOT_FOUND", "Prenotazione non trovata.");
    if (stored.reservation.status !== "cancelled") {
      stored.reservation = { ...stored.reservation, status: "cancelled", cancelled_at: "2026-10-16T10:05:00+02:00" };
    }
    return HttpResponse.json({ data: stored.reservation });
  }),
];
