// Utilità data/ora in Europe/Rome basate solo su Intl.
// Le date "YYYY-MM-DD" e i mesi "YYYY-MM" sono trattati come stringhe: mai `new Date("YYYY-MM-DD")`.

export const TIME_ZONE = "Europe/Rome";

const isoDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const romeTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

const longDateFormatter = new Intl.DateTimeFormat("it-IT", {
  timeZone: TIME_ZONE,
  weekday: "long",
  day: "numeric",
  month: "long",
});

const longDateWithYearFormatter = new Intl.DateTimeFormat("it-IT", {
  timeZone: TIME_ZONE,
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

const shortDateFormatter = new Intl.DateTimeFormat("it-IT", {
  timeZone: TIME_ZONE,
  weekday: "short",
  day: "numeric",
  month: "short",
});

const monthFormatter = new Intl.DateTimeFormat("it-IT", {
  timeZone: TIME_ZONE,
  month: "long",
  year: "numeric",
});

/** "Oggi" in Europe/Rome, indipendentemente dal fuso del dispositivo. */
export function todayInRome(now: Date = new Date()): string {
  return isoDateFormatter.format(now);
}

/** Ora corrente "HH:mm" in Europe/Rome. */
export function nowTimeInRome(now: Date = new Date()): string {
  return romeTimeFormatter.format(now);
}

export function currentMonthInRome(now: Date = new Date()): string {
  return monthOf(todayInRome(now));
}

function parseDate(date: string): [number, number, number] {
  const [year, month, day] = date.split("-").map(Number);
  return [year, month, day];
}

/** Istante sicuro per formattare una data locale: mezzogiorno UTC di quel giorno. */
function noonUtc(date: string): Date {
  const [year, month, day] = parseDate(date);
  return new Date(Date.UTC(year, month - 1, day, 12));
}

function toIsoDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

export function addDays(date: string, days: number): string {
  const value = noonUtc(date);
  value.setUTCDate(value.getUTCDate() + days);
  return toIsoDate(value);
}

export function monthOf(date: string): string {
  return date.slice(0, 7);
}

export function addMonths(month: string, months: number): string {
  const [year, monthNumber] = month.split("-").map(Number);
  const value = new Date(Date.UTC(year, monthNumber - 1 + months, 1, 12));
  return toIsoDate(value).slice(0, 7);
}

/** Differenza in mesi tra due "YYYY-MM" (b - a). */
export function monthDiff(a: string, b: string): number {
  const [ya, ma] = a.split("-").map(Number);
  const [yb, mb] = b.split("-").map(Number);
  return (yb - ya) * 12 + (mb - ma);
}

/** Giorno della settimana con lunedì = 0 … domenica = 6. */
export function weekdayIndex(date: string): number {
  return (noonUtc(date).getUTCDay() + 6) % 7;
}

export function dayOfMonth(date: string): number {
  return parseDate(date)[2];
}

function capitalize(value: string): string {
  return value.charAt(0).toLocaleUpperCase("it-IT") + value.slice(1);
}

/** "Martedì 20 ottobre" */
export function formatLongDate(date: string, options: { withYear?: boolean } = {}): string {
  const formatter = options.withYear ? longDateWithYearFormatter : longDateFormatter;
  return capitalize(formatter.format(noonUtc(date)));
}

/** "mar 20 ott" */
export function formatShortDate(date: string): string {
  return shortDateFormatter.format(noonUtc(date));
}

/** "Ottobre 2026" */
export function formatMonth(month: string): string {
  return capitalize(monthFormatter.format(noonUtc(`${month}-01`)));
}

/** Ora "HH:mm" in Europe/Rome di un istante ISO 8601 con offset. */
export function formatTimeOfInstant(iso: string): string {
  return romeTimeFormatter.format(new Date(iso));
}

const instantFormatter = new Intl.DateTimeFormat("it-IT", {
  timeZone: TIME_ZONE,
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** "16 ottobre 2026, 18:30" (Europe/Rome) da un istante ISO 8601. */
export function formatInstant(iso: string): string {
  return instantFormatter.format(new Date(iso));
}

/** Intervallo di mesi navigabili nel calendario (dal mese corrente, al massimo +12). */
export function calendarMonthRange(maxAdvanceDays: number, now: Date = new Date()) {
  const today = todayInRome(now);
  const first = monthOf(today);
  const hardLimit = addMonths(first, 12);
  if (maxAdvanceDays <= 0) return { first, last: hardLimit };
  const lastBookable = monthOf(addDays(today, maxAdvanceDays));
  return { first, last: lastBookable < hardLimit ? lastBookable : hardLimit };
}

/** Una prenotazione è passata quando data+ora sono precedenti all'istante attuale a Roma. */
export function isPast(date: string, time: string, now: Date = new Date()): boolean {
  return `${date}T${time}` < `${todayInRome(now)}T${nowTimeInRome(now)}`;
}

export function pluralizePeople(count: number): string {
  return count === 1 ? "1 persona" : `${count} persone`;
}
