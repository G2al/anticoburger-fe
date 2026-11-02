import { apiRequest } from "./client";
import type {
  Availability,
  BookingSettings,
  BookingHours,
  Calendar,
  CreatedReservation,
  CreateReservationInput,
  MenuCategory,
  RescheduleReservationInput,
  Reservation,
} from "./types";

export function getBookingSettings(signal?: AbortSignal) {
  return apiRequest<BookingSettings>("/booking-settings", { signal });
}

export function getBookingHours(signal?: AbortSignal) {
  return apiRequest<BookingHours>("/booking-hours", { signal });
}

export function getCalendar(month: string, partySize: number, signal?: AbortSignal) {
  const query = new URLSearchParams({ month, party_size: String(partySize) });
  return apiRequest<Calendar>(`/calendar?${query}`, { signal });
}

export function getAvailability(date: string, partySize: number, signal?: AbortSignal) {
  const query = new URLSearchParams({ date, party_size: String(partySize) });
  return apiRequest<Availability>(`/availability?${query}`, { signal });
}

/** Non idempotente: chi la chiama non deve mai ripeterla automaticamente. */
export function createReservation(input: CreateReservationInput) {
  return apiRequest<CreatedReservation>("/reservations", { method: "POST", body: input });
}

export function getReservation(reference: string, token: string, signal?: AbortSignal) {
  return apiRequest<Reservation>(`/reservations/${encodeURIComponent(reference)}`, { token, signal });
}

export function cancelReservation(reference: string, token: string) {
  return apiRequest<Reservation>(`/reservations/${encodeURIComponent(reference)}/cancel`, {
    method: "POST",
    token,
  });
}

/**
 * Sposta la prenotazione su nuova data/ora/persone. Atomica: se fallisce l'originale resta invariata.
 * Riferimento e token non cambiano. Non va ripetuta automaticamente.
 */
export function rescheduleReservation(reference: string, token: string, input: RescheduleReservationInput) {
  return apiRequest<Reservation>(`/reservations/${encodeURIComponent(reference)}/reschedule`, {
    method: "POST",
    token,
    body: input,
  });
}

export function getMenu(signal?: AbortSignal) {
  return apiRequest<MenuCategory[]>("/menu", { signal });
}
