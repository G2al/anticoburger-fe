"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createReservation } from "@/lib/api/endpoints";
import { isApiError } from "@/lib/api/errors";
import type { CreateReservationInput } from "@/lib/api/types";
import { invalidateAvailability } from "@/lib/query";

/** POST non idempotente: nessun retry (impostato anche nei default del QueryClient). */
export function useCreateReservation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateReservationInput) => createReservation(input),
    retry: false,
    onSuccess: () => {
      void invalidateAvailability(queryClient);
    },
    onError: (error) => {
      if (isApiError(error) && error.status === 409) void invalidateAvailability(queryClient);
    },
  });
}
