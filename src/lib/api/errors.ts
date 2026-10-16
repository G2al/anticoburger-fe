import type { ErrorCode } from "./types";

/**
 * Errore tipizzato restituito dal client HTTP per ogni risposta non 2xx o fallimento di rete.
 * Non contiene mai header né token della richiesta.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: ErrorCode;
  readonly fields: Record<string, string[]> | undefined;
  /** Secondi indicati dall'header Retry-After (solo 429). */
  readonly retryAfter: number | undefined;

  constructor(options: {
    status: number;
    code: ErrorCode;
    message: string;
    fields?: Record<string, string[]>;
    retryAfter?: number;
  }) {
    super(options.message);
    this.name = "ApiError";
    this.status = options.status;
    this.code = options.code;
    this.fields = options.fields;
    this.retryAfter = options.retryAfter;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/** Azione suggerita all'interfaccia per ciascun codice. */
export type ErrorAction =
  | "retry"
  | "fix-fields"
  | "pick-party-size"
  | "pick-date"
  | "pick-time"
  | "contact"
  | "none";

type ErrorInfo = { message: string; action: ErrorAction };

const GENERIC: ErrorInfo = {
  message: "Il servizio non è momentaneamente disponibile. Riprova tra qualche istante.",
  action: "retry",
};

const ERROR_INFO: Record<ErrorCode, ErrorInfo> = {
  NETWORK_ERROR: {
    message: "Connessione non disponibile. Controlla la rete e riprova.",
    action: "retry",
  },
  TIMEOUT: {
    message: "Il server non ha risposto in tempo. Riprova.",
    action: "retry",
  },
  INVALID_RESPONSE: GENERIC,
  SERVER_ERROR: GENERIC,
  HTTP_ERROR: GENERIC,
  NOT_FOUND: GENERIC,
  METHOD_NOT_ALLOWED: GENERIC,
  TOO_MANY_REQUESTS: {
    message: "Troppe richieste. Riprova tra qualche istante.",
    action: "retry",
  },
  VALIDATION_FAILED: {
    message: "Alcuni dati non sono validi. Controlla i campi evidenziati.",
    action: "fix-fields",
  },
  DATE_OUT_OF_RANGE: {
    message: "La data scelta non è più prenotabile. Scegline un'altra.",
    action: "pick-date",
  },
  MONTH_OUT_OF_RANGE: {
    message: "Questo mese non è consultabile.",
    action: "pick-date",
  },
  BOOKING_TOO_SOON: {
    message: "L'orario scelto è troppo vicino. Scegli un orario successivo.",
    action: "pick-time",
  },
  PARTY_SIZE_NOT_SUPPORTED: {
    message: "Non ci sono più tavoli prenotabili per questo numero di persone. Scegli di nuovo.",
    action: "pick-party-size",
  },
  SLOT_NOT_AVAILABLE: {
    message: "Questo orario è appena stato prenotato. Scegline un altro: i tuoi dati sono stati conservati.",
    action: "pick-time",
  },
  DUPLICATE_RESERVATION: {
    message: "Hai già una prenotazione identica per questo numero di telefono.",
    action: "none",
  },
  PHONE_DAILY_LIMIT_REACHED: {
    message:
      "Hai raggiunto il numero massimo di prenotazioni consentite per questo numero di telefono in questa giornata. Per esigenze particolari contatta il ristorante.",
    action: "contact",
  },
  RESERVATION_TOKEN_MISSING: {
    message: "Link incompleto. Apri il link di gestione completo ricevuto alla conferma.",
    action: "contact",
  },
  RESERVATION_NOT_FOUND: {
    message: "Prenotazione non trovata o link non valido. Per assistenza contatta il ristorante.",
    action: "contact",
  },
};

/** Messaggio italiano e azione per qualsiasi errore (basato su `code`, mai sul testo). */
export function describeError(error: unknown): ErrorInfo & { code: ErrorCode | "UNKNOWN" } {
  if (!isApiError(error)) return { ...GENERIC, code: "UNKNOWN" };

  if (error.code === "TOO_MANY_REQUESTS" && error.retryAfter && error.retryAfter > 0) {
    const seconds = error.retryAfter;
    return {
      code: error.code,
      action: "retry",
      message: `Troppe richieste. Riprova tra ${seconds} ${seconds === 1 ? "secondo" : "secondi"}.`,
    };
  }

  return { ...(ERROR_INFO[error.code] ?? GENERIC), code: error.code };
}

/** Le letture si possono ripetere solo per errori transitori, mai per i 4xx. */
export function isTransientError(error: unknown): boolean {
  if (!isApiError(error)) return false;
  if (error.code === "NETWORK_ERROR" || error.code === "TIMEOUT") return true;
  return error.status >= 500;
}
