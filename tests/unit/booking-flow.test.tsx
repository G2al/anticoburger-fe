import { screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse, delay } from "msw";
import { describe, expect, it, vi } from "vitest";
import { BookingFlow } from "@/components/booking/booking-flow";
import { DRAFT_KEY } from "@/components/booking/booking-draft";
import { STORAGE_KEY } from "@/lib/reservation-storage";
import { API, settings } from "../msw/fixtures";
import { apiError } from "../msw/handlers";
import { server } from "../msw/server";
import { renderWithProviders } from "../render";

type User = ReturnType<typeof renderWithProviders>["user"];

async function choosePartyAndDate(user: User, size = "2 persone", day = /^Martedì 20 ottobre/) {
  await user.click(await screen.findByRole("button", { name: size }));
  await user.click(screen.getByRole("button", { name: "Continua" }));
  await user.click(await screen.findByRole("button", { name: day }));
  await user.click(screen.getByRole("button", { name: "Continua" }));
}

async function reachDetails(user: User) {
  await choosePartyAndDate(user);
  await user.click(await screen.findByRole("button", { name: "Ore 20:00" }));
  await user.click(screen.getByRole("button", { name: "Continua" }));
  await screen.findByRole("heading", { name: "I tuoi dati" });
}

async function fillDetails(user: User, phone = "333 123 4567") {
  await user.type(screen.getByLabelText("Nome"), "Mario");
  await user.type(screen.getByLabelText("Cognome"), "Rossi");
  await user.type(screen.getByLabelText("Telefono"), phone);
}

/** Conta le richieste che passano da MSW per un certo path. */
function countRequests(path: string) {
  const counter = { count: 0 };
  server.events.on("request:start", ({ request }) => {
    if (new URL(request.url).pathname.endsWith(path)) counter.count += 1;
  });
  return counter;
}

describe("Step persone", () => {
  it("propone solo i valori di party_sizes", async () => {
    renderWithProviders(<BookingFlow />);
    const group = await screen.findByRole("group", { name: "Numero di persone" });
    const options = within(group).getAllByRole("button").map((button) => button.textContent);
    expect(options).toEqual(["2", "4", "6", "8"]);
    expect(screen.getByRole("button", { name: "Continua" })).toBeDisabled();
  });

  it("oltre 10 persone non si prenota online: invito a chiamare", async () => {
    server.use(
      http.get(`${API}/booking-settings`, () =>
        HttpResponse.json({ data: { ...settings, max_party_size: 12, party_sizes: [2, 4, 10, 12] } }),
      ),
    );
    renderWithProviders(<BookingFlow />);
    const group = await screen.findByRole("group", { name: "Numero di persone" });
    expect(within(group).getAllByRole("button").map((button) => button.textContent)).toEqual(["2", "4", "10"]);
    expect(screen.getByText("Siete più di 10 persone?")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Chiama +39 376 253 7179" })).toHaveAttribute("href", "tel:+393762537179");
  });

  it("mostra lo skeleton durante il caricamento", async () => {
    server.use(
      http.get(`${API}/booking-settings`, async () => {
        await delay(200);
        return HttpResponse.json({ data: settings });
      }),
    );
    renderWithProviders(<BookingFlow />);
    expect(await screen.findByLabelText("Caricamento")).toHaveAttribute("aria-busy", "true");
    expect(await screen.findByRole("button", { name: "2 persone" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Caricamento")).not.toBeInTheDocument();
  });

  it("senza tavoli configurati mostra lo stato non disponibile", async () => {
    server.use(
      http.get(`${API}/booking-settings`, () =>
        HttpResponse.json({ data: { ...settings, min_party_size: null, max_party_size: null, party_sizes: [] } }),
      ),
    );
    renderWithProviders(<BookingFlow />);
    expect(await screen.findByText("Prenotazioni online non disponibili")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Continua" })).not.toBeInTheDocument();
  });

  it("errore di rete: mostra Riprova e ricarica", async () => {
    server.use(http.get(`${API}/booking-settings`, () => HttpResponse.error()));
    const { user } = renderWithProviders(<BookingFlow />);
    const retry = await screen.findByRole("button", { name: "Riprova" }, { timeout: 6000 });
    expect(screen.getByText(/Connessione non disponibile/)).toBeInTheDocument();
    server.resetHandlers();
    await user.click(retry);
    expect(await screen.findByRole("button", { name: "2 persone" })).toBeInTheDocument();
  }, 10_000);
});

describe("Step data", () => {
  it("distingue i giorni del calendario e non seleziona quelli non disponibili", async () => {
    const { user } = renderWithProviders(<BookingFlow />);
    await user.click(await screen.findByRole("button", { name: "2 persone" }));
    await user.click(screen.getByRole("button", { name: "Continua" }));

    const grid = await screen.findByRole("grid", { name: "Ottobre 2026" });
    expect(within(grid).getByRole("button", { name: "Mercoledì 21 ottobre, chiuso" })).toHaveAttribute("aria-disabled", "true");
    expect(within(grid).getByRole("button", { name: "Venerdì 23 ottobre, completo" })).toHaveAttribute("aria-disabled", "true");
    expect(within(grid).getByRole("button", { name: "Giovedì 15 ottobre, non prenotabile" })).toHaveAttribute("aria-disabled", "true");
    expect(within(grid).getByRole("button", { name: "Venerdì 16 ottobre, disponibile" })).toHaveAttribute("aria-current", "date");

    await user.click(within(grid).getByRole("button", { name: "Venerdì 23 ottobre, completo" }));
    expect(screen.getByText(/è al completo/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continua" })).toBeDisabled();

    // Suggerimento della prima data libera.
    await user.click(screen.getByRole("button", { name: /Prima data libera: sabato 24 ottobre/ }));
    expect(within(grid).getByRole("button", { name: "Sabato 24 ottobre, disponibile" }).parentElement).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("button", { name: "Continua" })).toBeEnabled();
  });

  it("limita la navigazione dei mesi a max_advance_days", async () => {
    const { user } = renderWithProviders(<BookingFlow />);
    await user.click(await screen.findByRole("button", { name: "2 persone" }));
    await user.click(screen.getByRole("button", { name: "Continua" }));
    await screen.findByRole("grid", { name: "Ottobre 2026" });
    expect(screen.getByRole("button", { name: "Mese precedente" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Mese successivo" }));
    await screen.findByRole("grid", { name: "Novembre 2026" });
    expect(screen.getByRole("button", { name: "Mese successivo" })).toBeDisabled();
  });

  it("si muove nel calendario con le frecce", async () => {
    const { user } = renderWithProviders(<BookingFlow />);
    await user.click(await screen.findByRole("button", { name: "2 persone" }));
    await user.click(screen.getByRole("button", { name: "Continua" }));
    const today = await screen.findByRole("button", { name: "Venerdì 16 ottobre, disponibile" });
    expect(today).toHaveAttribute("tabindex", "0");
    today.focus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("button", { name: "Sabato 17 ottobre, disponibile" })).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("button", { name: "Sabato 24 ottobre, disponibile" })).toHaveFocus();
  });
});

describe("Step orario", () => {
  it("raggruppa gli slot e non mostra l'orario di fine", async () => {
    const { user } = renderWithProviders(<BookingFlow />);
    await choosePartyAndDate(user);
    expect(await screen.findByRole("group", { name: "Pranzo" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Cena" })).toBeInTheDocument();
    expect(screen.queryByText(/fine/i)).not.toBeInTheDocument();
  });

  it("slot vuoti: stato vuoto e ritorno alla data", async () => {
    const { user } = renderWithProviders(<BookingFlow />);
    await choosePartyAndDate(user, "2 persone", /^Giovedì 29 ottobre/);
    expect(await screen.findByText("Non ci sono più orari liberi in questa data.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Scegli un altro giorno" }));
    expect(await screen.findByRole("heading", { name: "Scegli il giorno" })).toBeInTheDocument();
  });
});

describe("Conferma", () => {
  it("valida i campi lato client con messaggi in italiano", async () => {
    const { user } = renderWithProviders(<BookingFlow />);
    await reachDetails(user);
    await user.type(screen.getByLabelText("Telefono"), "123");
    await user.click(screen.getByRole("button", { name: "Conferma prenotazione" }));
    expect(await screen.findByText("Inserisci il nome.")).toBeInTheDocument();
    expect(screen.getByText("Numero di telefono non valido. Esempio: 333 123 4567.")).toBeInTheDocument();
    expect(screen.getByLabelText("Nome")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText("Nome")).toHaveFocus();
  });

  it("mostra il successo solo dopo il 201, senza doppio invio, e salva in locale", async () => {
    const posts = countRequests("/reservations");
    server.use(
      http.post(`${API}/reservations`, async () => {
        await delay(150);
        return undefined; // passa all'handler standard
      }),
    );
    const { user } = renderWithProviders(<BookingFlow />);
    await reachDetails(user);
    await fillDetails(user);

    const submit = screen.getByRole("button", { name: "Conferma prenotazione" });
    await user.click(submit);
    const pending = await screen.findByRole("button", { name: /Invio in corso/ });
    expect(pending).toBeDisabled();
    await user.click(pending);
    expect(screen.queryByText("Prenotazione confermata")).not.toBeInTheDocument();

    expect(await screen.findByRole("heading", { name: "Prenotazione confermata" })).toBeInTheDocument();
    expect(posts.count).toBe(1);
    expect(screen.getByText("0AFD8AF6")).toBeInTheDocument();
    expect(screen.getByText("Fine prevista alle 21:00")).toBeInTheDocument();

    // Nota bene sull'arrivo.
    const arrival = screen.getByRole("region", { name: "Nota bene" });
    expect(arrival).toHaveTextContent("ritardo massimo di 15 minuti");
    expect(arrival).toHaveTextContent("attesa fino a 15 minuti");

    // "Dove ci troviamo": mappa e collegamenti a Google Maps.
    expect(screen.getByTitle(/^Mappa: Antico Burger/)).toHaveAttribute("src", expect.stringContaining("output=embed"));
    expect(screen.getByRole("link", { name: "Indicazioni stradali" })).toHaveAttribute(
      "href",
      expect.stringContaining("google.com/maps/dir/"),
    );
    expect(screen.getByRole("link", { name: "Apri in Google Maps" })).toHaveAttribute("target", "_blank");

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(stored[0]).toMatchObject({ date: "2026-10-20", time: "20:00", party_size: 2, first_name: "Mario" });
    expect(stored[0].token).toHaveLength(48);
  });

  it("409 SLOT_NOT_AVAILABLE: torna all'orario conservando i dati e ricarica gli slot", async () => {
    const availabilityRequests = countRequests("/availability");
    server.use(
      http.post(`${API}/reservations`, () =>
        apiError(409, "SLOT_NOT_AVAILABLE", "L'orario selezionato non è più disponibile."),
      ),
    );
    const { user } = renderWithProviders(<BookingFlow />);
    await reachDetails(user);
    await fillDetails(user);
    const before = availabilityRequests.count;
    await user.click(screen.getByRole("button", { name: "Conferma prenotazione" }));

    expect(await screen.findByRole("heading", { name: "Scegli l'orario" })).toBeInTheDocument();
    expect(screen.getByText(/appena stato prenotato/)).toBeInTheDocument();
    await waitFor(() => expect(availabilityRequests.count).toBeGreaterThan(before));
    expect(screen.queryByText("Prenotazione confermata")).not.toBeInTheDocument();

    await user.click(await screen.findByRole("button", { name: "Ore 21:00" }));
    await user.click(screen.getByRole("button", { name: "Continua" }));
    expect(await screen.findByLabelText("Nome")).toHaveValue("Mario");
    expect(screen.getByLabelText("Telefono")).toHaveValue("333 123 4567");
  });

  it("DUPLICATE_RESERVATION", async () => {
    server.use(
      http.post(`${API}/reservations`, () =>
        apiError(409, "DUPLICATE_RESERVATION", "Esiste già una prenotazione identica per questo numero di telefono."),
      ),
    );
    const { user } = renderWithProviders(<BookingFlow />);
    await reachDetails(user);
    await fillDetails(user);
    await user.click(screen.getByRole("button", { name: "Conferma prenotazione" }));
    expect(await screen.findByText("Hai già una prenotazione identica")).toBeInTheDocument();
  });

  it("PHONE_DAILY_LIMIT_REACHED", async () => {
    server.use(
      http.post(`${API}/reservations`, () => apiError(409, "PHONE_DAILY_LIMIT_REACHED", "Limite.")),
    );
    const { user } = renderWithProviders(<BookingFlow />);
    await reachDetails(user);
    await fillDetails(user);
    await user.click(screen.getByRole("button", { name: "Conferma prenotazione" }));
    expect(await screen.findByText("Limite giornaliero raggiunto")).toBeInTheDocument();
    expect(screen.getByText(/numero massimo di prenotazioni/)).toBeInTheDocument();
  });

  it("VALIDATION_FAILED: mappa fields sui campi del form", async () => {
    server.use(
      http.post(`${API}/reservations`, () =>
        apiError(422, "VALIDATION_FAILED", "I dati inviati non sono validi.", {
          fields: { phone: ["Il numero di telefono non è valido."] },
        }),
      ),
    );
    const { user } = renderWithProviders(<BookingFlow />);
    await reachDetails(user);
    await fillDetails(user);
    await user.click(screen.getByRole("button", { name: "Conferma prenotazione" }));
    expect(await screen.findByText("Il numero di telefono non è valido.")).toBeInTheDocument();
    expect(screen.getByLabelText("Telefono")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText("Telefono")).toHaveFocus();
  });

  it("PARTY_SIZE_NOT_SUPPORTED: ricarica le impostazioni e torna alle persone", async () => {
    server.use(
      http.post(`${API}/reservations`, () => apiError(422, "PARTY_SIZE_NOT_SUPPORTED", "Nessun tavolo.")),
    );
    const { user } = renderWithProviders(<BookingFlow />);
    await reachDetails(user);
    await fillDetails(user);
    await user.click(screen.getByRole("button", { name: "Conferma prenotazione" }));
    expect(await screen.findByRole("heading", { name: "Quante persone?" })).toBeInTheDocument();
    expect(screen.getByText(/Non ci sono più tavoli/)).toBeInTheDocument();
  });

  it("errore di rete sulla POST: esito incerto e nessun retry", async () => {
    const posts = countRequests("/reservations");
    server.use(http.post(`${API}/reservations`, () => HttpResponse.error()));
    const { user } = renderWithProviders(<BookingFlow />);
    await reachDetails(user);
    await fillDetails(user);
    await user.click(screen.getByRole("button", { name: "Conferma prenotazione" }));
    expect(await screen.findByText("Non sappiamo se la prenotazione è stata registrata")).toBeInTheDocument();
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(posts.count).toBe(1);
    expect(screen.queryByText("Prenotazione confermata")).not.toBeInTheDocument();
  });

  it("timeout sulla POST: esito incerto e nessun retry", async () => {
    const realFetch = globalThis.fetch;
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation((input, init) => {
      if (String(input).endsWith("/reservations") && init?.method === "POST") {
        // Non risponde mai: solo il timeout del client interrompe la richiesta.
        return new Promise((_, reject) =>
          init.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError"))),
        );
      }
      return realFetch(input, init);
    });
    const { user } = renderWithProviders(<BookingFlow />);
    await reachDetails(user);
    await fillDetails(user);

    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date"], now: new Date("2026-10-16T08:00:00Z") });
    screen.getByRole("button", { name: "Conferma prenotazione" }).click();
    await vi.advanceTimersByTimeAsync(15_001);
    vi.useRealTimers();

    expect(await screen.findByText("Non sappiamo se la prenotazione è stata registrata")).toBeInTheDocument();
    const posts = fetchSpy.mock.calls.filter(([input, init]) => String(input).endsWith("/reservations") && init?.method === "POST");
    expect(posts).toHaveLength(1);
  });
});

describe("Ripristino dopo reload", () => {
  const draft = (overrides: object) =>
    sessionStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({
        step: "details",
        partySize: 2,
        date: "2026-10-20",
        time: "20:00",
        details: { first_name: "Lucia", last_name: "Bianchi", phone: "06 1234567", email: "", notes: "Finestra" },
        confirmedReference: null,
        ...overrides,
      }),
    );

  it("ripristina step e dati dopo averli rivalidati con il backend", async () => {
    const availability = countRequests("/availability");
    draft({});
    renderWithProviders(<BookingFlow />);
    expect(await screen.findByRole("heading", { name: "I tuoi dati" })).toBeInTheDocument();
    expect(availability.count).toBeGreaterThan(0);
    expect(screen.getByLabelText("Nome")).toHaveValue("Lucia");
    expect(screen.getByLabelText(/^Note/)).toHaveValue("Finestra");
  });

  it("se l'orario non è più disponibile torna alla scelta dell'orario", async () => {
    draft({ time: "23:45" });
    renderWithProviders(<BookingFlow />);
    expect(await screen.findByRole("heading", { name: "Scegli l'orario" })).toBeInTheDocument();
    expect(screen.getByText("L'orario scelto non è più disponibile: scegline un altro.")).toBeInTheDocument();
  });

  it("una bozza con più di 10 persone torna allo step persone", async () => {
    server.use(
      http.get(`${API}/booking-settings`, () =>
        HttpResponse.json({ data: { ...settings, max_party_size: 12, party_sizes: [2, 4, 12] } }),
      ),
    );
    draft({ partySize: 12 });
    renderWithProviders(<BookingFlow />);
    expect(await screen.findByRole("heading", { name: "Quante persone?" })).toBeInTheDocument();
    expect(screen.getByText(/numero di persone scelto non è più disponibile/)).toBeInTheDocument();
  });

  it("se il numero di persone non è più accettato torna allo step persone", async () => {
    draft({ partySize: 3 });
    renderWithProviders(<BookingFlow />);
    expect(await screen.findByRole("heading", { name: "Quante persone?" })).toBeInTheDocument();
    expect(screen.getByText(/numero di persone scelto non è più disponibile/)).toBeInTheDocument();
  });

  it("dopo la conferma un reload mostra la prenotazione senza ripetere la POST", async () => {
    const posts = countRequests("/reservations");
    const { user, unmount } = renderWithProviders(<BookingFlow />);
    await reachDetails(user);
    await fillDetails(user);
    await user.click(screen.getByRole("button", { name: "Conferma prenotazione" }));
    await screen.findByRole("heading", { name: "Prenotazione confermata" });
    unmount();

    renderWithProviders(<BookingFlow />);
    expect(await screen.findByRole("heading", { name: "Prenotazione confermata" })).toBeInTheDocument();
    expect(posts.count).toBe(1);
  });
});
