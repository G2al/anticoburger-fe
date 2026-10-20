"use client";

import { useQuery } from "@tanstack/react-query";
import { Clock } from "lucide-react";
import { useHydrated } from "@/hooks/use-hydrated";
import { getBookingHours } from "@/lib/api/endpoints";
import { queryKeys, SETTINGS_STALE_TIME } from "@/lib/query";

const DAY_NAMES = ["Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato", "Domenica"];

export function BookingHours() {
  const hydrated = useHydrated();
  const { data, isError, fetchStatus, refetch, isFetching } = useQuery({
    queryKey: queryKeys.bookingHours,
    queryFn: ({ signal }) => getBookingHours(signal),
    staleTime: SETTINGS_STALE_TIME,
    enabled: hydrated,
  });

  const groupedDays = new Map<string, string[]>();
  for (const day of data?.days ?? []) {
    const hours = day.ranges.length
      ? day.ranges.map((range) => `${range.first_booking_time} – ${range.last_booking_time}`).join(" / ")
      : "Chiuso";
    const names = groupedDays.get(hours) ?? [];
    names.push(DAY_NAMES[day.day_of_week - 1]);
    groupedDays.set(hours, names);
  }

  return (
    <div className="flex flex-col gap-2">
      <h3 className="flex items-center gap-2 text-sm font-medium">
        <Clock className="size-4 text-brass" aria-hidden />
        Orari di prenotazione
      </h3>
      {data ? (
        <>
          <ul className="flex flex-col gap-1.5 text-sm" aria-label="Orari settimanali di prenotazione">
            {[...groupedDays].sort(([a], [b]) => Number(a === "Chiuso") - Number(b === "Chiuso")).map(([hours, names]) => (
              <li key={hours} className="flex items-start justify-between gap-4">
                <span className="min-w-0">
                  {names.join(", ") === "Lunedì, Mercoledì, Giovedì, Venerdì, Domenica"
                    ? "Lunedì – Domenica"
                    : names.join(", ")}
                </span>
                <span className="shrink-0 text-right text-muted-foreground tabular">{hours}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground">
            Fasce di arrivo prenotabili. Consulta il calendario per disponibilità e chiusure straordinarie.
          </p>
        </>
      ) : isError || fetchStatus === "paused" ? (
        <div className="text-sm text-muted-foreground" role="status">
          <p>Orari al momento non disponibili. Contattaci per informazioni.</p>
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching || fetchStatus === "paused"}
            className="min-h-11 cursor-pointer underline underline-offset-4 disabled:opacity-50"
          >
            Riprova
          </button>
        </div>
      ) : (
        <p role="status" className="text-sm text-muted-foreground">Caricamento degli orari…</p>
      )}
    </div>
  );
}
