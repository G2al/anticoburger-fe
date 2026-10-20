import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { MenuPrice } from "@/components/menu/menu-price";
import { MenuView } from "@/components/menu/menu-view";
import { API, menuFixture } from "../msw/fixtures";
import { apiError } from "../msw/handlers";
import { server } from "../msw/server";
import { renderWithProviders } from "../render";

function countMenuRequests() {
  const counter = { count: 0 };
  server.events.on("request:start", ({ request }) => {
    if (new URL(request.url).pathname.endsWith("/menu")) counter.count += 1;
  });
  return counter;
}

/** Sezione di una categoria (lo Special compare anche nella sezione "Special"). */
const section = (name: string) => screen.findByRole("region", { name });

function tone(card: HTMLElement) {
  if (card.className.includes("ring-menu-gold")) return "special";
  return card.className.includes("bg-menu-brown") ? "marrone" : "beige";
}

/** Menu senza prodotti Special. */
const withoutSpecials = menuFixture.map((category) => ({
  ...category,
  items: category.items.map((item) => ({ ...item, is_special: false })),
}));

describe("Menu dal backend", () => {
  it("mostra categorie e prodotti nell'ordine ricevuto, con la sezione Special in cima", async () => {
    renderWithProviders(<MenuView />);
    await section("Panini");
    const sections = screen.getAllByRole("region");
    expect(sections.map((region) => within(region).getByRole("heading", { level: 2 }).textContent)).toEqual([
      "Special",
      "Panini",
      "Bibite",
    ]);
    const panini = within(sections[1]).getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent);
    expect(panini).toEqual(["Antico Burger", "Classic Burger", "Poll-Gin"]);
  });

  it("alterna marrone/beige sui prodotti normali; gli Special hanno la propria scheda", async () => {
    renderWithProviders(<MenuView />);
    const panini = await section("Panini");
    expect(within(panini).getAllByRole("article").map(tone)).toEqual(["special", "marrone", "beige"]);
    const bibite = await section("Bibite");
    expect(within(bibite).getAllByRole("article").map(tone)).toEqual(["marrone"]);
  });

  it("formatta i prezzi in italiano", async () => {
    renderWithProviders(<MenuView />);
    const panini = await section("Panini");
    const card = within(panini).getByRole("article", { name: "Antico Burger" });
    expect(within(card).getByText(/^Prezzo: 14,90\s€$/)).toBeInTheDocument();
    expect(card).toHaveTextContent("€14,90");
    expect(within(panini).getByRole("article", { name: "Classic Burger" })).toHaveTextContent(/Prezzo: 12,00\s€/);
  });

  it("usa la foto quando c'è e un segnaposto quando image_url è null", async () => {
    renderWithProviders(<MenuView />);
    const panini = await section("Panini");
    const photo = within(within(panini).getByRole("article", { name: "Antico Burger" })).getByRole("img", {
      name: "Antico Burger",
    });
    expect(photo.tagName).toBe("IMG");
    // Backend locale: servita direttamente (Next non ottimizza da IP locali).
    expect(photo).toHaveAttribute("src", "http://127.0.0.1:8000/storage/menu/abc123.png");

    const classic = within(panini).getByRole("article", { name: "Classic Burger" });
    expect(within(classic).getByRole("img", { name: "Classic Burger" }).tagName).toBe("DIV");
  });

  it("mostra gli ingredienti solo se presenti", async () => {
    renderWithProviders(<MenuView />);
    const panini = await section("Panini");
    const antico = within(panini).getByRole("article", { name: "Antico Burger" });
    expect(within(antico).getByText("Pane brioche, manzo 200 g, cheddar, bacon")).toBeInTheDocument();
    const classic = within(panini).getByRole("article", { name: "Classic Burger" });
    // Solo il paragrafo del prezzo: nessuna descrizione vuota.
    expect(within(classic).getAllByRole("paragraph")).toHaveLength(1);
  });

  it("navigazione per categoria con i chip, Special per primo", async () => {
    const { user } = renderWithProviders(<MenuView />);
    const nav = await screen.findByRole("navigation", { name: "Categorie del menu" });
    const chips = within(nav).getAllByRole("button");
    expect(chips.map((chip) => chip.textContent)).toEqual(["Special", "Panini", "Bibite"]);
    expect(chips[0]).toHaveAttribute("aria-current", "true");
    await user.click(chips[2]);
    expect(chips[2]).toHaveAttribute("aria-current", "true");
  });

  it("menu vuoto", async () => {
    server.use(http.get(`${API}/menu`, () => HttpResponse.json({ data: [] })));
    renderWithProviders(<MenuView />);
    expect(await screen.findByText("Il menu sarà disponibile a breve.")).toBeInTheDocument();
  });

  it("errore del server: Riprova ricarica il menu", async () => {
    server.use(http.get(`${API}/menu`, () => apiError(500, "SERVER_ERROR", "Errore.")));
    const { user } = renderWithProviders(<MenuView />);
    const retry = await screen.findByRole("button", { name: "Riprova" }, { timeout: 8000 });
    expect(screen.getByText(/non è momentaneamente disponibile/)).toBeInTheDocument();
    server.resetHandlers();
    await user.click(retry);
    expect(await section("Panini")).toBeInTheDocument();
  }, 12_000);

  it("429: messaggio con Retry-After e nessun nuovo tentativo automatico", async () => {
    const requests = countMenuRequests();
    server.use(
      http.get(`${API}/menu`, () =>
        HttpResponse.json(
          { error: { code: "TOO_MANY_REQUESTS", message: "Troppe richieste." } },
          { status: 429, headers: { "Retry-After": "30" } },
        ),
      ),
    );
    renderWithProviders(<MenuView />);
    expect(await screen.findByText("Troppe richieste. Riprova tra 30 secondi.")).toBeInTheDocument();
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(requests.count).toBe(1);
  });

  it("skeleton durante il caricamento", async () => {
    server.use(
      http.get(`${API}/menu`, async () => {
        await new Promise((resolve) => setTimeout(resolve, 150));
        return HttpResponse.json({ data: [] });
      }),
    );
    renderWithProviders(<MenuView />);
    expect(screen.getByLabelText("Caricamento del menu")).toHaveAttribute("aria-busy", "true");
    await waitFor(() => expect(screen.queryByLabelText("Caricamento del menu")).not.toBeInTheDocument());
  });
});

describe("Special", () => {
  it("la sezione Special raccoglie gli is_special e li lascia anche nella loro categoria", async () => {
    renderWithProviders(<MenuView />);
    const special = await section("Special");
    const cards = within(special).getAllByRole("article");
    expect(cards.map((card) => within(card).getByRole("heading", { level: 3 }).textContent)).toEqual(["Antico Burger"]);
    expect(cards.map(tone)).toEqual(["special"]);
    expect(within(cards[0]).getByText("Special")).toBeInTheDocument();
    // Stesso prodotto anche in "Panini", con id distinti (nessun id duplicato nella pagina).
    const panini = await section("Panini");
    expect(within(panini).getByRole("article", { name: "Antico Burger" })).toBeInTheDocument();
    const ids = [...document.querySelectorAll("[id]")].map((node) => node.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("senza prodotti Special niente sezione né chip", async () => {
    server.use(http.get(`${API}/menu`, () => HttpResponse.json({ data: withoutSpecials })));
    renderWithProviders(<MenuView />);
    await section("Panini");
    expect(screen.queryByRole("region", { name: "Special" })).not.toBeInTheDocument();
    const chips = within(screen.getByRole("navigation", { name: "Categorie del menu" })).getAllByRole("button");
    expect(chips.map((chip) => chip.textContent)).toEqual(["Panini", "Bibite"]);
  });
});

describe("MenuPrice", () => {
  it("centesimi in apice e niente ',00' a schermo", () => {
    const { container, rerender } = renderWithProviders(<MenuPrice price="11.50" />);
    expect(container).toHaveTextContent("€11,50");
    rerender(<MenuPrice price="12.00" />);
    expect(container).toHaveTextContent(/^Prezzo: 12,00\s€€12$/);
  });
});

describe("Immagine non caricabile", () => {
  it("se la foto del backend fallisce mostra il segnaposto", async () => {
    renderWithProviders(<MenuView />);
    const panini = await section("Panini");
    const card = within(panini).getByRole("article", { name: "Antico Burger" });
    fireEvent.error(within(card).getByRole("img", { name: "Antico Burger" }));
    expect(within(card).getByRole("img", { name: "Antico Burger" }).tagName).toBe("DIV");
  });
});
