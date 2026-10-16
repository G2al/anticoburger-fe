// Stato del flusso salvato in sessionStorage per sopravvivere al ricaricamento.
// Contiene solo dati inseriti dall'utente: mai token o disponibilità (che va sempre riletta).

import { readJson, removeItem, writeItem } from "@/lib/safe-storage";
import { EMPTY_GUEST_DETAILS, type GuestDetails } from "@/lib/guest-details";

export const DRAFT_KEY = "ab:booking-draft:v1";

export const STEPS = ["party", "date", "time", "details"] as const;
export type FormStep = (typeof STEPS)[number];
export type Step = FormStep | "done";

export type BookingDraft = {
  step: Step;
  partySize: number | null;
  date: string | null;
  time: string | null;
  details: GuestDetails;
  /** Riferimento della prenotazione confermata (step "done"). */
  confirmedReference: string | null;
};

export const INITIAL_DRAFT: BookingDraft = {
  step: "party",
  partySize: null,
  date: null,
  time: null,
  details: EMPTY_GUEST_DETAILS,
  confirmedReference: null,
};

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^\d{2}:\d{2}$/;

/** Legge la bozza scartando valori incoerenti: il ripristino non deve mai rompere il flusso. */
export function loadDraft(): BookingDraft {
  const raw = readJson<Partial<BookingDraft>>("session", DRAFT_KEY);
  if (!raw || typeof raw !== "object") return INITIAL_DRAFT;

  const partySize = typeof raw.partySize === "number" ? raw.partySize : null;
  const date = partySize !== null && typeof raw.date === "string" && DATE.test(raw.date) ? raw.date : null;
  const time = date !== null && typeof raw.time === "string" && TIME.test(raw.time) ? raw.time : null;
  const details = { ...EMPTY_GUEST_DETAILS };
  if (raw.details && typeof raw.details === "object") {
    for (const key of Object.keys(details) as (keyof GuestDetails)[]) {
      const value = (raw.details as Record<string, unknown>)[key];
      if (typeof value === "string") details[key] = value;
    }
  }
  const confirmedReference = typeof raw.confirmedReference === "string" ? raw.confirmedReference : null;

  let step: Step = "party";
  if (raw.step === "done" && confirmedReference) step = "done";
  else if (raw.step === "details" && time) step = "details";
  else if ((raw.step === "time" || raw.step === "details") && date) step = "time";
  else if (raw.step !== "party" && partySize !== null) step = "date";

  return { step, partySize, date, time, details, confirmedReference };
}

export function saveDraft(draft: BookingDraft): void {
  if (draft === INITIAL_DRAFT) {
    removeItem("session", DRAFT_KEY);
    return;
  }
  writeItem("session", DRAFT_KEY, JSON.stringify(draft));
}

export function stepIndex(step: Step): number {
  return step === "done" ? STEPS.length : STEPS.indexOf(step);
}
