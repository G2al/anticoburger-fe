import { QueryClient, type QueryClient as QueryClientType } from "@tanstack/react-query";
import { isTransientError } from "@/lib/api/errors";

export const queryKeys = {
  settings: ["booking-settings"] as const,
  calendarAll: ["calendar"] as const,
  calendar: (month: string, partySize: number) => ["calendar", month, partySize] as const,
  availabilityAll: ["availability"] as const,
  availability: (date: string, partySize: number) => ["availability", date, partySize] as const,
  menu: ["menu"] as const,
  // Il token non entra mai nella chiave.
  reservation: (reference: string) => ["reservation", reference] as const,
};

export const SETTINGS_STALE_TIME = 5 * 60_000;
export const AVAILABILITY_STALE_TIME = 30_000;
/** Allineato al Cache-Control del backend (max-age=60). */
export const MENU_STALE_TIME = 60_000;

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: true,
        // Mai ripetere i 4xx (incluso 429); al massimo due tentativi per errori transitori.
        retry: (failureCount, error) => failureCount < 2 && isTransientError(error),
        gcTime: 5 * 60_000,
      },
      mutations: {
        retry: false,
        // Offline la mutazione deve fallire subito, non restare in coda per un invio differito.
        networkMode: "always",
      },
    },
  });
}

/** Dopo 201, 409 o annullamento la disponibilità mostrata non è più affidabile. */
export function invalidateAvailability(client: QueryClientType) {
  return Promise.all([
    client.invalidateQueries({ queryKey: queryKeys.calendarAll }),
    client.invalidateQueries({ queryKey: queryKeys.availabilityAll }),
  ]);
}
