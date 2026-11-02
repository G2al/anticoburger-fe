"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { rescheduleReservation } from "@/lib/api/endpoints";
import { isApiError } from "@/lib/api/errors";
import type { RescheduleReservationInput } from "@/lib/api/types";
import { invalidateAvailability, queryKeys } from "@/lib/query";
import { syncStoredReservation } from "@/lib/reservation-storage";

/**
 * Modifica di una prenotazione. Nessun retry (POST non idempotente).
 * - 200: dettaglio e archivio locale aggiornati, disponibilità da rileggere (il vecchio orario si è liberato);
 * - 409/422 di disponibilità: calendario e orari da rileggere;
 * - rete/timeout: esito incerto, si rilegge il dettaglio per mostrare lo stato reale.
 */
export function useRescheduleReservation(reference: string, token: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: RescheduleReservationInput) => rescheduleReservation(reference, token, input),
    retry: false,
    onSuccess: (reservation) => {
      queryClient.setQueryData(queryKeys.reservation(reference), reservation);
      syncStoredReservation(reservation);
      void invalidateAvailability(queryClient);
    },
    onError: (error) => {
      if (!isApiError(error)) return;
      if (error.status === 409 || error.code === "BOOKING_TOO_SOON" || error.code === "DATE_OUT_OF_RANGE") {
        void invalidateAvailability(queryClient);
      }
      if (error.code === "PARTY_SIZE_NOT_SUPPORTED") {
        void queryClient.invalidateQueries({ queryKey: queryKeys.settings });
      }
      if (error.code === "NETWORK_ERROR" || error.code === "TIMEOUT" || error.status === 409) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.reservation(reference) });
      }
    },
  });
}
