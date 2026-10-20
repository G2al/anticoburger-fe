import type { Page } from "@playwright/test";
import { calendarFor, DEFAULT_SLOTS, menuFixture, NOW, settings } from "../tests/msw/fixtures";
import { E2E_API_BASE_URL } from "../playwright.config";

// Backend simulato con page.route, con le stesse forme del contratto API.

const TOKEN = "hS3IfT912aMyhYNryf9dAB7OvHjJikixWeBp4fQZd9H0IR4c";
const REFERENCE = "0afd8af6-ba21-49eb-b53a-f61ceb0d4105";

const cors = {
  "Access-Control-Allow-Origin": "http://localhost:3100",
  "Access-Control-Allow-Headers": "Accept, Content-Type, X-Requested-With, X-Reservation-Token",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Expose-Headers": "Retry-After",
};

export async function mockApi(page: Page) {
  await page.clock.setFixedTime(NOW);
  const state: { reservation: Record<string, unknown> | null } = { reservation: null };

  await page.route(`${E2E_API_BASE_URL}/**`, async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace(new URL(E2E_API_BASE_URL).pathname, "");
    const json = (body: unknown, status = 200) =>
      route.fulfill({ status, contentType: "application/json", headers: cors, body: JSON.stringify(body) });

    if (request.method() === "OPTIONS") return route.fulfill({ status: 204, headers: cors });
    if (path === "/booking-settings") return json({ data: settings });
    if (path === "/menu") return json({ data: menuFixture });
    if (path === "/calendar") {
      return json({ data: calendarFor(url.searchParams.get("month")!, Number(url.searchParams.get("party_size"))) });
    }
    if (path === "/availability") {
      const date = url.searchParams.get("date")!;
      return json({ data: { date, party_size: Number(url.searchParams.get("party_size")), slots: DEFAULT_SLOTS } });
    }
    if (path === "/reservations" && request.method() === "POST") {
      const body = request.postDataJSON();
      state.reservation = {
        reference: REFERENCE,
        status: "confirmed",
        ...body,
        starts_at: `${body.date}T${body.time}:00+02:00`,
        ends_at: `${body.date}T21:30:00+02:00`,
        cancelled_at: null,
      };
      return json({ data: { ...state.reservation, cancellation_token: TOKEN } }, 201);
    }
    if (path.startsWith("/reservations/")) {
      if (request.headers()["x-reservation-token"] !== TOKEN || !state.reservation) {
        return json({ error: { code: "RESERVATION_NOT_FOUND", message: "Prenotazione non trovata." } }, 404);
      }
      if (path.endsWith("/cancel")) {
        state.reservation = { ...state.reservation, status: "cancelled", cancelled_at: "2026-10-16T10:05:00+02:00" };
      }
      return json({ data: state.reservation });
    }
    return json({ error: { code: "NOT_FOUND", message: "Risorsa non trovata." } }, 404);
  });

  return { TOKEN, REFERENCE };
}
