// Archivio locale delle prenotazioni effettuate da questo dispositivo.
// Il token è un segreto: resta solo qui e nell'header X-Reservation-Token, mai in log o URL di query.

import type { Reservation, ReservationStatus } from "@/lib/api/types";
import { isPast } from "@/lib/date";
import { readJson, writeItem } from "@/lib/safe-storage";

export const STORAGE_KEY = "ab:reservations:v1";
const CHANGE_EVENT = "ab:reservations-change";

export type StoredReservation = {
  reference: string;
  token: string;
  date: string;
  time: string;
  party_size: number;
  first_name: string;
  status: ReservationStatus;
  /** Fine prevista (ISO), utile per mostrare la conferma dopo un reload. */
  ends_at?: string;
  starts_at?: string;
  savedAt: string;
};

const EMPTY: StoredReservation[] = [];
let cachedRaw: string | null | undefined;
let cachedList: StoredReservation[] = EMPTY;

function isStoredReservation(value: unknown): value is StoredReservation {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.reference === "string" &&
    typeof item.token === "string" &&
    typeof item.date === "string" &&
    typeof item.time === "string" &&
    typeof item.party_size === "number"
  );
}

/** Elenco ordinato per data/ora. Il risultato è stabile finché lo storage non cambia. */
export function listStoredReservations(): StoredReservation[] {
  const data = readJson<unknown>("local", STORAGE_KEY);
  const raw = data === null ? null : JSON.stringify(data);
  if (raw === cachedRaw) return cachedList;
  cachedRaw = raw;
  cachedList = Array.isArray(data)
    ? data.filter(isStoredReservation).sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`))
    : EMPTY;
  return cachedList;
}

function persist(list: StoredReservation[]): boolean {
  const saved = writeItem("local", STORAGE_KEY, JSON.stringify(list));
  if (typeof window !== "undefined") window.dispatchEvent(new Event(CHANGE_EVENT));
  return saved;
}

export function findStoredReservation(reference: string): StoredReservation | undefined {
  return listStoredReservations().find((item) => item.reference === reference);
}

/** Salva o aggiorna una prenotazione. Restituisce `false` se lo storage persistente non è disponibile. */
export function saveReservation(reservation: Reservation, token: string): boolean {
  const entry: StoredReservation = {
    reference: reservation.reference,
    token,
    date: reservation.date,
    time: reservation.time,
    party_size: reservation.party_size,
    first_name: reservation.first_name,
    status: reservation.status,
    starts_at: reservation.starts_at,
    ends_at: reservation.ends_at,
    savedAt: new Date().toISOString(),
  };
  const others = listStoredReservations().filter((item) => item.reference !== reservation.reference);
  return persist([...others, entry]);
}

/**
 * Allinea la copia locale ai dati del backend (il ristorante può aver cambiato data, ora, persone o stato).
 * Scrive solo se qualcosa è cambiato: il token e la data di salvataggio restano quelli originali.
 */
export function syncStoredReservation(reservation: Reservation): void {
  const list = listStoredReservations();
  const current = list.find((item) => item.reference === reservation.reference);
  if (!current) return;
  const updated: StoredReservation = {
    ...current,
    date: reservation.date,
    time: reservation.time,
    party_size: reservation.party_size,
    first_name: reservation.first_name,
    status: reservation.status,
    starts_at: reservation.starts_at,
    ends_at: reservation.ends_at,
  };
  const changed = (Object.keys(updated) as (keyof StoredReservation)[]).some((key) => updated[key] !== current[key]);
  if (changed) persist(list.map((item) => (item.reference === reservation.reference ? updated : item)));
}

export function updateStoredStatus(reference: string, status: ReservationStatus): void {
  const list = listStoredReservations();
  if (!list.some((item) => item.reference === reference)) return;
  persist(list.map((item) => (item.reference === reference ? { ...item, status } : item)));
}

/** Toglie la voce solo da questo dispositivo: la prenotazione sul server non cambia. */
export function removeStoredReservation(reference: string): void {
  persist(listStoredReservations().filter((item) => item.reference !== reference));
}

/** Rimette una voce rimossa (es. "Annulla" dopo una rimozione dall'elenco). */
export function restoreStoredReservation(entry: StoredReservation): void {
  const others = listStoredReservations().filter((item) => item.reference !== entry.reference);
  persist([...others, entry]);
}

export function removePastReservations(now: Date = new Date()): void {
  persist(listStoredReservations().filter((item) => !isPast(item.date, item.time, now)));
}

export function upcomingReservations(list: StoredReservation[], now: Date = new Date()) {
  return list.filter((item) => !isPast(item.date, item.time, now));
}

/** Per useSyncExternalStore: notifica i cambi della stessa scheda e delle altre schede. */
export function subscribeToReservations(onChange: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === STORAGE_KEY) onChange();
  };
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

export function getServerReservationsSnapshot(): StoredReservation[] {
  return EMPTY;
}
