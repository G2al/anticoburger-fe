"use client";

import { useQueries } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";
import { getReservation } from "@/lib/api/endpoints";
import { isApiError } from "@/lib/api/errors";
import { isPast } from "@/lib/date";
import { queryKeys } from "@/lib/query";
import { removeStoredReservation, syncStoredReservation, type StoredReservation } from "@/lib/reservation-storage";

/** Breve: evita doppie richieste ravvicinate (rate limit 30/min) ma rivalida a ogni ritorno in primo piano. */
const SYNC_STALE_TIME = 10_000;

/**
 * Verifica in background con il backend le prenotazioni future salvate sul dispositivo.
 * La copia locale resta visibile e viene aggiornata appena arrivano le risposte:
 * - 200: dati e stato aggiornati (anche se il ristorante ha cambiato data, ora o persone);
 * - 404 (eliminata, riferimento o token errati) e 401 (token mancante): voce rimossa dal dispositivo;
 * - rete, timeout, 5xx, 429: nessuna modifica, si riprova alla prossima occasione.
 * Rivalida all'apertura e al ritorno in primo piano (visibilitychange, gestito da TanStack Query).
 */
export function useSyncStoredReservations(reservations: StoredReservation[], now: Date) {
  const future = reservations.filter((item) => !isPast(item.date, item.time, now));

  const results = useQueries({
    queries: future.map((item) => ({
      // Stessa chiave della pagina di gestione: niente richieste duplicate. Il token non entra nella chiave.
      queryKey: queryKeys.reservation(item.reference),
      queryFn: ({ signal }: { signal: AbortSignal }) => getReservation(item.reference, item.token, signal),
      staleTime: SYNC_STALE_TIME,
      refetchOnWindowFocus: true,
    })),
  });

  // Firma stabile dei risultati: l'effetto riparte solo quando arriva una risposta nuova.
  const signature = results.map((result) => `${result.dataUpdatedAt}:${result.errorUpdatedAt}`).join("|");

  useEffect(() => {
    let removed = 0;
    results.forEach((result, index) => {
      const item = future[index];
      if (!item) return;
      // Prima l'errore: dopo un refetch fallito TanStack conserva i dati precedenti in `data`.
      if (result.isError) {
        const code = isApiError(result.error) ? result.error.code : null;
        if (code === "RESERVATION_NOT_FOUND" || code === "RESERVATION_TOKEN_MISSING") {
          removeStoredReservation(item.reference);
          removed += 1;
        }
        // Rete, timeout, 5xx, 429: nessuna modifica.
        return;
      }
      if (result.data && result.data.reference === item.reference) syncStoredReservation(result.data);
    });
    if (removed > 0) {
      toast("Una prenotazione non è più presente", {
        id: "reservation-removed",
        description: "Per informazioni contatta il ristorante.",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- dipende solo dalle nuove risposte (signature)
  }, [signature]);
}
