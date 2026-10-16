import { expect, test } from "@playwright/test";
import { E2E_API_BASE_URL } from "../playwright.config";

// Suite contro il backend Laravel reale (DB di test, porta 8010). Nessun mock: verifica anche CORS.
// Richiede almeno un tavolo prenotabile configurato da /admin, altrimenti viene saltata con il motivo.

test("prenotazione e annullamento reali contro il backend", async ({ page, request }) => {
  const settingsResponse = await request.get(`${E2E_API_BASE_URL}/booking-settings`, {
    headers: { Accept: "application/json" },
    failOnStatusCode: false,
  });
  test.skip(!settingsResponse.ok(), `Backend non raggiungibile su ${E2E_API_BASE_URL}`);
  const { data: settings } = await settingsResponse.json();
  test.skip(settings.party_sizes.length === 0, "Nessun tavolo configurato nel DB di test (party_sizes vuoto)");

  const partySize: number = settings.party_sizes[0];
  // Telefono casuale: evita DUPLICATE_RESERVATION e PHONE_DAILY_LIMIT_REACHED tra un'esecuzione e l'altra.
  const phone = `3${Math.floor(100_000_000 + Math.random() * 899_999_999)}`;

  await page.goto("/prenota");
  await page.getByRole("button", { name: partySize === 1 ? "1 persona" : `${partySize} persone` }).click();
  await page.getByRole("button", { name: "Continua" }).click();

  // Primo giorno disponibile, eventualmente nel mese successivo.
  const grid = page.getByRole("grid");
  await expect(grid).toBeVisible();
  const available = grid.getByRole("button", { name: /, disponibile$/ });
  if ((await available.count()) === 0) {
    const next = page.getByRole("button", { name: "Mese successivo" });
    test.skip(await next.isDisabled(), "Nessun giorno disponibile nel DB di test");
    await next.click();
    await expect(grid.getByRole("button").first()).toBeVisible();
  }
  test.skip((await available.count()) === 0, "Nessun giorno disponibile nel DB di test");
  await available.first().click();
  await page.getByRole("button", { name: "Continua" }).click();

  const slot = page.getByRole("button", { name: /^Ore \d{2}:\d{2}$/ }).first();
  await expect(slot).toBeVisible();
  await slot.click();
  await page.getByRole("button", { name: "Continua" }).click();

  await page.getByLabel("Nome", { exact: true }).fill("Test");
  await page.getByLabel("Cognome").fill("E2E");
  await page.getByLabel("Telefono").fill(phone);
  await page.getByRole("button", { name: "Conferma prenotazione" }).click();

  await expect(page.getByRole("heading", { name: "Prenotazione confermata" })).toBeVisible();
  await expect(page.getByText(/^Fine prevista alle \d{2}:\d{2}$/)).toBeVisible();

  await page.getByRole("link", { name: "Le mie prenotazioni" }).click();
  await expect(page.getByRole("heading", { name: "Le mie prenotazioni" })).toBeVisible();
  await page.getByRole("link", { name: /Ore \d{2}:\d{2}/ }).first().click();
  await expect(page.getByRole("heading", { name: "La tua prenotazione" })).toBeVisible();
  await expect(page.getByText("Confermata", { exact: true }).filter({ visible: true })).toBeVisible();

  await page.getByRole("button", { name: "Annulla prenotazione" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Sì, annulla" }).click();
  await expect(page.getByText("Annullata", { exact: true }).filter({ visible: true })).toBeVisible();

  // Annullamento idempotente lato API.
  await page.reload();
  await expect(page.getByText("Annullata", { exact: true }).filter({ visible: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Annulla prenotazione" })).toHaveCount(0);
});
