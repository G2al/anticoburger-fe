import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ReservationManager } from "@/components/reservation/reservation-manager";
import type { Reservation } from "@/lib/api/types";
import { findStoredReservation, saveReservation } from "@/lib/reservation-storage";
import { db } from "../msw/handlers";
import { renderWithProviders } from "../render";

const TOKEN = "hS3IfT912aMyhYNryf9dAB7OvHjJikixWeBp4fQZd9H0IR4c";
const REFERENCE = "0afd8af6-ba21-49eb-b53a-f61ceb0d4105";

function seed(overrides: Partial<Reservation> = {}) {
  const reservation: Reservation = {
    reference: REFERENCE,
    status: "confirmed",
    date: "2026-10-20",
    time: "20:30",
    party_size: 2,
    starts_at: "2026-10-20T20:30:00+02:00",
    ends_at: "2026-10-20T21:30:00+02:00",
    first_name: "Mario",
    last_name: "Rossi",
    phone: "333 123 4567",
    email: "mario@example.com",
    notes: "Zona tranquilla",
    cancelled_at: null,
    ...overrides,
  };
  db.reservations.set(REFERENCE, { reservation, token: TOKEN });
  return reservation;
}

describe("Gestione prenotazione", () => {
  it("legge ref e token dal frammento, mostra il dettaglio e toglie il token dall'URL", async () => {
    seed();
    window.location.hash = `#ref=${REFERENCE}&token=${TOKEN}`;
    renderWithProviders(<ReservationManager />);
    expect(await screen.findByText("Martedì 20 ottobre 2026")).toBeInTheDocument();
    expect(screen.getByText("Confermata")).toBeInTheDocument();
    expect(screen.getByText("Fine prevista alle 21:30")).toBeInTheDocument();
    expect(findStoredReservation(REFERENCE)?.token).toBe(TOKEN);
    expect(window.location.hash).toBe(`#ref=${REFERENCE}`);
    expect(window.location.href).not.toContain(TOKEN);
  });

  it("annulla dopo la conferma e aggiorna l'archivio locale", async () => {
    seed();
    window.location.hash = `#ref=${REFERENCE}&token=${TOKEN}`;
    const { user } = renderWithProviders(<ReservationManager />);
    await user.click(await screen.findByRole("button", { name: "Annulla prenotazione" }));
    const dialog = await screen.findByRole("alertdialog");
    expect(within(dialog).getByText("Annullare la prenotazione?")).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Sì, annulla" }));

    expect(await screen.findByText("Prenotazione annullata")).toBeInTheDocument();
    expect(screen.getByText("Annullata")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Annulla prenotazione" })).not.toBeInTheDocument();
    expect(findStoredReservation(REFERENCE)?.status).toBe("cancelled");
  });

  it("prenotazione già annullata: nessun pulsante di annullamento", async () => {
    seed({ status: "cancelled", cancelled_at: "2026-10-16T09:00:00+02:00" });
    window.location.hash = `#ref=${REFERENCE}&token=${TOKEN}`;
    renderWithProviders(<ReservationManager />);
    expect(await screen.findByText("Annullata")).toBeInTheDocument();
    expect(screen.getByText("Annullata il 16 ottobre 2026 alle ore 09:00.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Annulla prenotazione" })).not.toBeInTheDocument();
  });

  it("token errato: 404 con messaggio e rimozione locale solo dopo conferma", async () => {
    seed();
    saveReservation(seed(), "token-sbagliato");
    window.location.hash = `#ref=${REFERENCE}`;
    const { user } = renderWithProviders(<ReservationManager />);
    expect(await screen.findByText(/Prenotazione non trovata o link non valido/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Rimuovi da questo dispositivo" }));
    expect(findStoredReservation(REFERENCE)).toBeDefined();
    await user.click(await screen.findByRole("button", { name: "Rimuovi" }));
    expect(findStoredReservation(REFERENCE)).toBeUndefined();
  });

  it("token mancante: link incompleto", async () => {
    window.location.hash = `#ref=${REFERENCE}`;
    renderWithProviders(<ReservationManager />);
    expect(await screen.findByText("Link incompleto")).toBeInTheDocument();
  });

  it("senza frammento invita ad aprire il link o l'elenco", async () => {
    renderWithProviders(<ReservationManager />);
    expect(await screen.findByText("Nessuna prenotazione selezionata")).toBeInTheDocument();
  });
});
