import { defineConfig, devices } from "@playwright/test";

// Una sola build per tutte le suite: le API puntano al backend di test (porta 8010).
// Le suite "mock" intercettano queste URL con page.route; la suite "backend" le usa davvero.
// Porta dedicata: non interferisce con un eventuale `npm run dev` sulla 3000.
// Per la suite "backend" l'origin http://localhost:3100 deve essere in CORS_ALLOWED_ORIGINS del backend di test.
export const E2E_PORT = 3100;
export const E2E_API_BASE_URL = process.env.E2E_API_BASE_URL ?? "http://127.0.0.1:8010/api/v1";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${E2E_PORT}`,
    trace: "retain-on-failure",
    locale: "it-IT",
    timezoneId: "Europe/Rome",
  },
  projects: [
    // page.route non intercetta le richieste gestite dal service worker: le suite mock lo bloccano.
    { name: "mobile-chrome", testMatch: /booking\.spec\.ts/, use: { ...devices["Pixel 7"], serviceWorkers: "block" } },
    { name: "mobile-safari", testMatch: /booking\.spec\.ts/, use: { ...devices["iPhone 14"], serviceWorkers: "block" } },
    { name: "viewports", testMatch: /layout\.spec\.ts/, use: { ...devices["Desktop Chrome"], serviceWorkers: "block" } },
    { name: "backend", testMatch: /backend\.spec\.ts/, use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: `npm run build && npm run start -- --port ${E2E_PORT}`,
    url: `http://localhost:${E2E_PORT}`,
    reuseExistingServer: process.env.E2E_REUSE === "1",
    timeout: 300_000,
    env: { NEXT_PUBLIC_API_BASE_URL: E2E_API_BASE_URL, APP_VERSION: "e2e" },
  },
});
