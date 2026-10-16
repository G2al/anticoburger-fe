import { expect, test } from "@playwright/test";
import { mockApi } from "./mock-api";

test("flusso completo: prenotazione, gestione e annullamento", async ({ page }) => {
  const { TOKEN } = await mockApi(page);

  await page.goto("/");
  await page.getByRole("link", { name: "Prenota un tavolo" }).click();

  await page.getByRole("button", { name: "4 persone" }).click();
  await page.getByRole("button", { name: "Continua" }).click();

  await expect(page.getByRole("heading", { name: "Scegli il giorno" })).toBeFocused();
  await page.getByRole("button", { name: "Martedì 20 ottobre, disponibile" }).click();
  await page.getByRole("button", { name: "Continua" }).click();

  await page.getByRole("button", { name: "Ore 20:00" }).click();
  await page.getByRole("button", { name: "Continua" }).click();

  await page.getByLabel("Nome", { exact: true }).fill("Mario");
  await page.getByLabel("Cognome").fill("Rossi");
  await page.getByLabel("Telefono").fill("333 123 4567");
  await page.getByRole("button", { name: "Conferma prenotazione" }).click();

  await expect(page.getByRole("heading", { name: "Prenotazione confermata" })).toBeVisible();
  await expect(page.getByText("0AFD8AF6")).toBeVisible();
  await expect(page.getByText("Fine prevista alle 21:30")).toBeVisible();

  // Reload della pagina di successo: niente seconda POST.
  let posts = 0;
  page.on("request", (request) => {
    if (request.method() === "POST" && request.url().endsWith("/reservations")) posts += 1;
  });
  await page.reload();
  await expect(page.getByRole("heading", { name: "Prenotazione confermata" })).toBeVisible();
  expect(posts).toBe(0);

  await page.getByRole("link", { name: "Le mie prenotazioni" }).click();
  await expect(page.getByRole("heading", { name: "Le mie prenotazioni" })).toBeVisible();
  await page.getByRole("link", { name: /Martedì 20 ottobre/ }).click();
  await expect(page.getByRole("heading", { name: "La tua prenotazione" })).toBeVisible();
  await expect(page.getByText("Confermata", { exact: true }).filter({ visible: true })).toBeVisible();
  expect(page.url()).not.toContain(TOKEN);

  await page.getByRole("button", { name: "Annulla prenotazione" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Sì, annulla" }).click();
  await expect(page.getByText("Prenotazione annullata", { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Annulla prenotazione" })).toHaveCount(0);
});

test("il link di gestione dal frammento funziona e il token sparisce dall'URL", async ({ page }) => {
  const { TOKEN, REFERENCE } = await mockApi(page);
  // Crea la prenotazione nel mock passando dal flusso API.
  await page.goto("/");
  await page.evaluate(
    async ([api]) =>
      fetch(`${api}/reservations`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ date: "2026-10-20", time: "20:00", party_size: 2, first_name: "Anna", last_name: "Verdi", phone: "3331234567" }),
      }),
    [process.env.E2E_API_BASE_URL ?? "http://127.0.0.1:8010/api/v1"],
  );

  await page.goto(`/prenotazione#ref=${REFERENCE}&token=${TOKEN}`);
  await expect(page.getByText("Anna Verdi")).toBeVisible();
  await expect.poll(() => page.url()).not.toContain("token=");
});
