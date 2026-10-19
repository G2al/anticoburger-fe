import { screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import { MyReservations, NextReservationCard } from "@/components/reservation/my-reservations";
import { Toaster } from "@/components/ui/sonner";
import type { Reservation } from "@/lib/api/types";
import { findStoredReservation, saveReservation } from "@/lib/reservation-storage";
import { API } from "../msw/fixtures";
import { apiError, db } from "../msw/handlers";
import { server } from "../msw/server";
import { renderWithProviders } from "../render";

function reservation(reference: string, overrides: Partial<Reservation> = {}): Reservation {
  return {
    reference,
    status: "confirmed",
    date: "2026-10-22",
    time: "21:30",
    party_size: 2,
    starts_at: "2026-10-22T21:30:00+02:00",
    ends_at: "2026-10-22T22:30:00+02:00",
    first_name: "Luigi",
    last_name: "Rossi",
    phone: "333 123 4567",
    email: null,
    notes: null,
    cancelled_at: null,
    ...overrides,
  };
}

/** Copia locale salvata dalla PWA e, se indicato, prenotazione presente nel backend simulato. */
function seed(reference: string, onServer: Partial<Reservation> | null, local: Partial<Reservation> = {}) {
  const token = `token-${reference}`;
  saveReservation(reservation(reference, local), token);
  if (onServer) db.reservations.set(reference, { reservation: reservation(reference, onServer), token });
}

function countRequests() {
  const counter = { count: 0 };
  server.events.on("request:start", ({ request }) => {
    if (new URL(request.url).pathname.includes("/reservations/")) counter.count += 1;
  });
  return counter;
}

describe("Sincronizzazione delle prenotazioni salvate", () => {
  it("404: eliminata dal gestionale, sparisce dalla home e dall'archivio locale", async () => {
    seed("eliminata", null);
    renderWithProviders(
      <>
        <NextReservationCard />
        <Toaster />
      </>,
    );
    // Si vede subito la copia locale (nessuno skeleton), poi la verifica la toglie.
    expect(screen.getByRole("link", { name: /La tua prossima prenotazione/ })).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole("link", { name: /La tua prossima prenotazione/ })).not.toBeInTheDocument());
    expect(findStoredReservation("eliminata")).toBeUndefined();
    expect(await screen.findByText(/Una prenotazione non è più presente/)).toBeInTheDocument();
  });

  it("200 confirmed: aggiorna data, ora e persone modificate dal ristorante", async () => {
    seed("modificata", {
      date: "2026-10-24",
      time: "20:00",
      party_size: 4,
      starts_at: "2026-10-24T20:00:00+02:00",
      ends_at: "2026-10-24T21:30:00+02:00",
    });
    renderWithProviders(<NextReservationCard />);
    const card = screen.getByRole("link", { name: /La tua prossima prenotazione/ });
    expect(card).toHaveTextContent("Giovedì 22 ottobre");
    await waitFor(() => expect(card).toHaveTextContent("Sabato 24 ottobre"));
    expect(card).toHaveTextContent("Ore 20:00 · 4 persone");
    expect(findStoredReservation("modificata")).toMatchObject({
      date: "2026-10-24",
      time: "20:00",
      party_size: 4,
      ends_at: "2026-10-24T21:30:00+02:00",
      token: "token-modificata",
    });
  });

  it("200 cancelled: non è più la prossima, resta tra le annullate", async () => {
    seed("annullata-admin", { status: "cancelled", cancelled_at: "2026-10-16T09:00:00+02:00" });
    renderWithProviders(<MyReservations />);
    expect(await screen.findByRole("region", { name: "Prossime" })).toBeInTheDocument();
    const cancelled = await screen.findByRole("region", { name: "Annullate" });
    expect(within(cancelled).getByText("Giovedì 22 ottobre")).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Prossime" })).not.toBeInTheDocument();
    expect(findStoredReservation("annullata-admin")?.status).toBe("cancelled");
  });

  it("errore di rete: non cancella nulla", async () => {
    seed("offline", { time: "23:00" });
    server.use(http.get(`${API}/reservations/:reference`, () => HttpResponse.error()));
    renderWithProviders(<NextReservationCard />);
    // Attende anche i tentativi automatici sugli errori transitori.
    await new Promise((resolve) => setTimeout(resolve, 3500));
    expect(screen.getByRole("link", { name: /La tua prossima prenotazione/ })).toHaveTextContent("Ore 21:30");
    expect(findStoredReservation("offline")?.time).toBe("21:30");
  }, 10_000);

  it("429: non cancella nulla e non ritenta", async () => {
    seed("limite", null);
    const requests = countRequests();
    server.use(
      http.get(`${API}/reservations/:reference`, () =>
        apiError(429, "TOO_MANY_REQUESTS", "Troppe richieste. Riprova tra poco."),
      ),
    );
    renderWithProviders(<NextReservationCard />);
    await waitFor(() => expect(requests.count).toBe(1));
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(requests.count).toBe(1);
    expect(findStoredReservation("limite")).toBeDefined();
    expect(screen.getByRole("link", { name: /La tua prossima prenotazione/ })).toBeInTheDocument();
  });

  it("prenotazioni miste: una richiesta per ciascuna futura, nessuna per le passate", async () => {
    seed("ok", {});
    seed("sparita", null, { date: "2026-10-20" });
    seed("annullata", { status: "cancelled" }, { date: "2026-10-25" });
    seed("passata", null, { date: "2026-10-01" });
    const requests = countRequests();
    renderWithProviders(<MyReservations />);

    await waitFor(() => expect(findStoredReservation("sparita")).toBeUndefined());
    await waitFor(() => expect(findStoredReservation("annullata")?.status).toBe("cancelled"));
    expect(findStoredReservation("ok")?.status).toBe("confirmed");
    // La passata non viene verificata e non viene toccata.
    expect(findStoredReservation("passata")).toBeDefined();
    expect(requests.count).toBe(3);

    const upcoming = await screen.findByRole("region", { name: "Prossime" });
    expect(within(upcoming).getAllByRole("link")).toHaveLength(1);
  });

  it("token mancante nella copia locale (401): dato non valido, rimosso", async () => {
    seed("senza-token", {});
    // Copia locale corrotta: token vuoto.
    const raw = JSON.parse(localStorage.getItem("ab:reservations:v1")!);
    raw[0].token = "";
    localStorage.setItem("ab:reservations:v1", JSON.stringify(raw));
    renderWithProviders(<NextReservationCard />);
    await waitFor(() => expect(findStoredReservation("senza-token")).toBeUndefined());
  });

  it("torna in primo piano: rivalida di nuovo", async () => {
    seed("focus", {});
    const requests = countRequests();
    renderWithProviders(<NextReservationCard />);
    await waitFor(() => expect(requests.count).toBe(1));

    // Il ristorante la elimina mentre l'app è in background.
    db.reservations.delete("focus");
    vi.setSystemTime(new Date(Date.now() + 60_000));
    Object.defineProperty(document, "visibilityState", { configurable: true, value: "hidden" });
    document.dispatchEvent(new Event("visibilitychange", { bubbles: true }));
    Object.defineProperty(document, "visibilityState", { configurable: true, value: "visible" });
    document.dispatchEvent(new Event("visibilitychange", { bubbles: true }));

    await waitFor(() => expect(requests.count).toBe(2));
    await waitFor(() => expect(findStoredReservation("focus")).toBeUndefined());
  });
});
