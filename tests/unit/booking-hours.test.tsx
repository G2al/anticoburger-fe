import { screen, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { BookingHours } from "@/components/home/booking-hours";
import { API, bookingHours } from "../msw/fixtures";
import { server } from "../msw/server";
import { renderWithProviders } from "../render";

describe("Orari della home", () => {
  it("legge gli orari dal backend, con martedì chiuso e sabato diverso", async () => {
    renderWithProviders(<BookingHours />);
    const list = await screen.findByRole("list", { name: "Orari settimanali di prenotazione" });
    const rows = within(list).getAllByRole("listitem");
    expect(rows).toHaveLength(3);
    expect(rows[0]).toHaveTextContent("Lunedì – Domenica18:30 – 23:25");
    expect(rows[1]).toHaveTextContent("Sabato18:30 – 21:00");
    expect(rows[2]).toHaveTextContent("MartedìChiuso");
  });

  it("riflette cambiamenti del backend e conserva fasce separate", async () => {
    server.use(http.get(`${API}/booking-hours`, () => HttpResponse.json({
      data: { ...bookingHours, days: [{ day_of_week: 2, ranges: [
        { first_booking_time: "12:00", last_booking_time: "14:00" },
        { first_booking_time: "19:00", last_booking_time: "22:00" },
      ] }] },
    })));
    renderWithProviders(<BookingHours />);
    expect(await screen.findByRole("listitem")).toHaveTextContent("Martedì12:00 – 14:00 / 19:00 – 22:00");
  });

  it("se le API falliscono non mostra orari inventati e permette di riprovare", async () => {
    server.use(http.get(`${API}/booking-hours`, () => new HttpResponse(null, { status: 404 })));
    const { user } = renderWithProviders(<BookingHours />);
    const retry = await screen.findByRole("button", { name: "Riprova" });
    expect(screen.queryByText("Chiuso")).not.toBeInTheDocument();
    server.resetHandlers();
    await user.click(retry);
    expect(await screen.findByRole("list")).toBeInTheDocument();
  });
});
