// Tipi del contratto API (FRONTEND_HANDOFF.md §5). Corrispondono 1:1 alle API Resources Laravel.

export type ApiSuccess<T> = { data: T };

export type ApiErrorCode =
  | "VALIDATION_FAILED"
  | "DATE_OUT_OF_RANGE"
  | "MONTH_OUT_OF_RANGE"
  | "BOOKING_TOO_SOON"
  | "PARTY_SIZE_NOT_SUPPORTED"
  | "SLOT_NOT_AVAILABLE"
  | "DUPLICATE_RESERVATION"
  | "PHONE_DAILY_LIMIT_REACHED"
  | "RESERVATION_TOKEN_MISSING"
  | "RESERVATION_NOT_FOUND"
  | "NOT_FOUND"
  | "METHOD_NOT_ALLOWED"
  | "TOO_MANY_REQUESTS"
  | "HTTP_ERROR"
  | "SERVER_ERROR";

/** Codici generati dal client quando non c'è una risposta conforme del backend. */
export type ClientErrorCode = "NETWORK_ERROR" | "TIMEOUT" | "INVALID_RESPONSE";

export type ErrorCode = ApiErrorCode | ClientErrorCode;

export type ApiErrorBody = {
  error: {
    code: ApiErrorCode;
    message: string;
    fields?: Record<string, string[]>;
  };
};

export type BookingSettings = {
  timezone: string;
  min_lead_minutes: number;
  max_advance_days: number;
  min_party_size: number | null;
  max_party_size: number | null;
  party_sizes: number[];
};

export type BookingHours = {
  timezone: string;
  days: {
    day_of_week: number;
    ranges: { first_booking_time: string; last_booking_time: string }[];
  }[];
};

export type CalendarDayStatus = "available" | "fully_booked" | "closed" | "not_bookable";

export type CalendarDay = { date: string; status: CalendarDayStatus };

export type Calendar = {
  month: string;
  party_size: number;
  days: CalendarDay[];
};

export type Availability = {
  date: string;
  party_size: number;
  slots: string[];
};

export type CreateReservationInput = {
  date: string;
  time: string;
  party_size: number;
  first_name: string;
  last_name: string;
  phone: string;
  email?: string | null;
  notes?: string | null;
};

export type ReservationStatus = "confirmed" | "cancelled";

export type Reservation = {
  reference: string;
  status: ReservationStatus;
  date: string;
  time: string;
  party_size: number;
  starts_at: string;
  ends_at: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string | null;
  notes: string | null;
  cancelled_at: string | null;
};

export type CreatedReservation = Reservation & {
  cancellation_token: string;
};

export type MenuItem = {
  id: number;
  name: string;
  /** Decimale come stringa, sempre 2 cifre ("14.90"). */
  price: string;
  /** Testo libero, può contenere virgole. */
  ingredients: string | null;
  is_special: boolean;
  /** URL assoluto dell'immagine sul backend. */
  image_url: string | null;
};

/** Le categorie arrivano nell'ordine deciso dall'admin; quelle vuote non vengono restituite. */
export type MenuCategory = { id: number; name: string; items: MenuItem[] };
