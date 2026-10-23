import { fireEvent, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { DETAIL_IMAGE_SIZES } from "@/components/menu/menu-image";
import { MenuView } from "@/components/menu/menu-view";
import { renderWithProviders } from "../render";

// File separato: il precaricamento ricorda le foto già scaricate (stato a livello di modulo).
describe("Precaricamento della foto del dettaglio", () => {
  const OriginalImage = window.Image;
  afterEach(() => {
    window.Image = OriginalImage;
  });

  it("al tocco della scheda avvia il download della versione del modale, una sola volta", async () => {
    const created: HTMLImageElement[] = [];
    window.Image = class extends OriginalImage {
      constructor() {
        super();
        created.push(this);
      }
    } as typeof Image;

    renderWithProviders(<MenuView />);
    const panini = await screen.findByRole("region", { name: "Panini" });
    const button = within(panini).getByRole("button", { name: "Dettagli di Poll-Gin" });

    fireEvent.pointerDown(button);
    expect(created).toHaveLength(1);
    expect(created[0].sizes).toBe(DETAIL_IMAGE_SIZES);
    expect(created[0].srcset).toContain("/_next/image?url=https%3A%2F%2Fadmin.anticoburger.it%2Fstorage%2Fmenu%2Fpollgin.png");

    fireEvent.pointerDown(button);
    expect(created).toHaveLength(1);
  });

  it("il passaggio del dito senza mouse non precarica (solo il mouse lo fa al passaggio)", async () => {
    const created: HTMLImageElement[] = [];
    window.Image = class extends OriginalImage {
      constructor() {
        super();
        created.push(this);
      }
    } as typeof Image;

    renderWithProviders(<MenuView />);
    const panini = await screen.findByRole("region", { name: "Panini" });
    fireEvent.pointerEnter(within(panini).getByRole("button", { name: "Dettagli di Antico Burger" }), {
      pointerType: "touch",
    });
    expect(created).toHaveLength(0);
    fireEvent.pointerEnter(within(panini).getByRole("button", { name: "Dettagli di Antico Burger" }), {
      pointerType: "mouse",
    });
    expect(created).toHaveLength(1);
  });

});
