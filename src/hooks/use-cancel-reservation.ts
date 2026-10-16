"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cancelReservation } from "@/lib/api/endpoints";
import { invalidateAvailability, queryKeys } from "@/lib/query";
import { updateStoredStatus } from "@/lib/reservation-storage";

export function useCancelReservation(reference: string, token: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => cancelReservation(reference, token),
    retry: false,
    onSuccess: (reservation) => {
      queryClient.setQueryData(queryKeys.reservation(reference), reservation);
      updateStoredStatus(reference, reservation.status);
      void invalidateAvailability(queryClient);
    },
  });
}
