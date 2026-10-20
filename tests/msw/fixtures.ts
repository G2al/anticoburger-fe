import type { BookingSettings, Calendar, CalendarDayStatus, MenuCategory } from "@/lib/api/types";

export const API = "http://api.test/api/v1";

/** "Adesso" dei test: venerdì 16 ottobre 2026, 10:00 a Roma. */
export const NOW = new Date("2026-10-16T08:00:00Z");

export const settings: BookingSettings = {
  timezone: "Europe/Rome",
  min_lead_minutes: 30,
  max_advance_days: 30,
  min_party_size: 2,
  max_party_size: 8,
  // Volutamente non consecutivi.
  party_sizes: [2, 4, 6, 8],
};

/** Ottobre come nell'esempio reale del contratto: 21 chiuso, 23 completo, 26–27 ferie, 29 "available" ma ormai senza slot. */
export function calendarFor(month: string, partySize: number): Calendar {
  const [year, monthNumber] = month.split("-").map(Number);
  const daysInMonth = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const date = `${month}-${String(i + 1).padStart(2, "0")}`;
    return { date, status: statusFor(date) };
  });
  return { month, party_size: partySize, days };
}

function statusFor(date: string): CalendarDayStatus {
  if (date < "2026-10-16" || date > "2026-11-15") return "not_bookable";
  if (["2026-10-21", "2026-10-26", "2026-10-27"].includes(date)) return "closed";
  if (date === "2026-10-23") return "fully_booked";
  return "available";
}

export const DEFAULT_SLOTS = ["12:30", "13:00", "19:00", "19:30", "20:00", "20:30", "21:00"];

/** Menu come lo restituisce GET /menu: categorie nell'ordine dell'admin (non alfabetico), prodotti in ordine alfabetico. */
export const menuFixture: MenuCategory[] = [
  {
    id: 2,
    name: "Panini",
    items: [
      {
        id: 7,
        name: "Antico Burger",
        price: "14.90",
        ingredients: "Pane brioche, manzo 200 g, cheddar, bacon",
        is_special: true,
        image_url: "http://127.0.0.1:8000/storage/menu/abc123.png",
      },
      { id: 9, name: "Classic Burger", price: "12.00", ingredients: null, is_special: false, image_url: null },
      {
        id: 11,
        name: "Poll-Gin",
        price: "11.50",
        ingredients: "Sovracoscia di pollo impanata ai cornflakes, crema di piselli, stracciata di bufala",
        is_special: false,
        image_url: "https://admin.anticoburger.it/storage/menu/pollgin.png",
      },
    ],
  },
  {
    id: 5,
    name: "Bibite",
    items: [{ id: 21, name: "Acqua naturale", price: "2.00", ingredients: null, is_special: false, image_url: null }],
  },
];
