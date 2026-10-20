import { expect, test, type Page } from "@playwright/test";
import { mockApi } from "./mock-api";

const VIEWPORTS = [
  { width: 360, height: 740 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1280, height: 800 },
];

async function expectNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
}

async function expectInViewport(page: Page, name: string) {
  const box = await page.getByRole("button", { name }).or(page.getByRole("link", { name })).first().boundingBox();
  const viewport = page.viewportSize()!;
  expect(box).not.toBeNull();
  expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height);
  expect(box!.height).toBeGreaterThanOrEqual(44);
}

for (const viewport of VIEWPORTS) {
  test(`layout ${viewport.width}×${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await mockApi(page);

    await page.goto("/");
    await expectNoHorizontalScroll(page);
    await expectInViewport(page, "Prenota un tavolo");

    await page.goto("/menu");
    await expect(page.getByRole("article", { name: "Antico Burger" })).toBeVisible();
    await expectNoHorizontalScroll(page);

    await page.goto("/prenota");
    await page.getByRole("button", { name: "2 persone" }).click();
    await expectInViewport(page, "Continua");
    await page.getByRole("button", { name: "Continua" }).click();
    await expect(page.getByRole("grid")).toBeVisible();
    await expectNoHorizontalScroll(page);
    await expectInViewport(page, "Continua");

    // La barra azioni include il padding della safe area (minimo 16px).
    const padding = await page
      .getByRole("button", { name: "Continua" })
      .evaluate((button) => getComputedStyle(button.closest(".sticky")!).paddingBottom);
    expect(parseFloat(padding)).toBeGreaterThanOrEqual(16);

    // Aree touch dei giorni ≥ 44px.
    const day = await page.getByRole("button", { name: /disponibile$/ }).first().boundingBox();
    expect(day!.height).toBeGreaterThanOrEqual(44);
    expect(day!.width).toBeGreaterThanOrEqual(44);
  });
}
