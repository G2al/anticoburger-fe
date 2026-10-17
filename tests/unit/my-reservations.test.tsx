import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MyReservations, NextReservationCard } from "@/components/reservation/my-reservations";
import { Toaster } from "@/components/ui/sonner";
import type { Reservation } from "@/lib/api/types";
import { findStoredReservation, saveReservation } from "@/lib/reservation-storage";
import { renderWithProviders } from "../render";

function store(reference: string, overrides: Partial<Reservation> = {}) {
  saveReservation(
    {
      reference,
      status: "confirmed",
      date: "2026-10-20",
      time: "20:30",
      party_size: 2,
      starts_at: "2026-10-20T20:30:00+02:00",
      ends_at: "2026-10-20T21:30:00+02:00",
      first_name: "Mario",
      last_name: "Rossi",
      phone: "333 123 4567",
      email: null,
      notes: null,
      cancelled_at: null,
      ...overrides,
    },
    `token-${reference}`,
  );
}

describe("Le mie prenotazioni", () => {
  it("separa prossime e annullate e nasconde le passate", async () => {
    store("attiva");
    store("annullata", { status: "cancelled", date: "2026-10-22", time: "21:00" });
    store("passata", { date: "2026-10-01" });
    renderWithProviders(<MyReservations />);

    const upcoming = await screen.findByRole("region", { name: "Prossime" });
    expect(within(upcoming).getByText("Martedì 20 ottobre")).toBeInTheDocument();
    const cancelled = screen.getByRole("region", { name: "Annullate" });
    expect(within(cancelled).getByText("Giovedì 22 ottobre")).toBeInTheDocument();
    expect(screen.queryByText("Giovedì 1 ottobre")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Rimuovi 1 prenotazione passata" })).toBeInTheDocument();

    // Solo le annullate si possono togliere con un tocco.
    expect(within(upcoming).queryByRole("button", { name: /Rimuovi/ })).not.toBeInTheDocument();
  });

  it("rimuove un'annullata dall'elenco e la ripristina con Annulla", async () => {
    store("annullata", { status: "cancelled" });
    const { user } = renderWithProviders(
      <>
        <MyReservations />
        <Toaster />
      </>,
    );

    await user.click(await screen.findByRole("button", { name: /^Rimuovi dall'elenco la prenotazione annullata/ }));
    expect(findStoredReservation("annullata")).toBeUndefined();
    expect(await screen.findByText("Rimossa dall'elenco")).toBeInTheDocument();
    expect(screen.getByText("Non ci sono prenotazioni future salvate su questo dispositivo.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Annulla" }));
    expect(findStoredReservation("annullata")?.token).toBe("token-annullata");
    expect(await screen.findByRole("region", { name: "Annullate" })).toBeInTheDocument();
  });
});

describe("Prossima prenotazione in home", () => {
  it("non mostra nulla senza prenotazioni confermate future", () => {
    store("annullata", { status: "cancelled" });
    const { container } = renderWithProviders(<NextReservationCard />);
    expect(container).toBeEmptyDOMElement();
  });

  it("mostra la più vicina e il link all'elenco se ce ne sono altre", async () => {
    store("dopo", { date: "2026-10-24", time: "19:30" });
    store("prima", { date: "2026-10-20", time: "20:30" });
    renderWithProviders(<NextReservationCard />);
    const card = await screen.findByRole("link", { name: /La tua prossima prenotazione/ });
    expect(card).toHaveTextContent("Martedì 20 ottobre");
    expect(card).toHaveAttribute("href", "/prenotazione#ref=prima");
    expect(screen.getByRole("link", { name: "Vedi tutte le prenotazioni (2)" })).toHaveAttribute("href", "/prenotazioni");
  });
});
