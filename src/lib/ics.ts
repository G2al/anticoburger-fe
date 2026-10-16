// Evento calendario (.ics) generato nel browser. Non contiene mai il token di annullamento.

import { restaurant } from "@/config/restaurant";

type IcsReservation = {
  reference: string;
  starts_at: string;
  ends_at: string;
  party_size: number;
};

function toIcsUtc(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function escapeText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/([,;])/g, "\\$1");
}

export function buildIcs(reservation: IcsReservation, now: Date = new Date()): string {
  const people = reservation.party_size === 1 ? "1 persona" : `${reservation.party_size} persone`;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Antico Burger//Prenotazioni//IT",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${reservation.reference}@anticoburger.it`,
    `DTSTAMP:${toIcsUtc(now.toISOString())}`,
    `DTSTART:${toIcsUtc(reservation.starts_at)}`,
    `DTEND:${toIcsUtc(reservation.ends_at)}`,
    `SUMMARY:${escapeText(`Tavolo da ${restaurant.name}`)}`,
    `DESCRIPTION:${escapeText(`Prenotazione per ${people}.`)}`,
    `LOCATION:${escapeText(restaurant.address)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return `${lines.join("\r\n")}\r\n`;
}

export function downloadIcs(reservation: IcsReservation): void {
  const blob = new Blob([buildIcs(reservation)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "prenotazione-antico-burger.ics";
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
