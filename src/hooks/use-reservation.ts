"use client";

import { useQuery } from "@tanstack/react-query";
import { getReservation } from "@/lib/api/endpoints";
import { queryKeys } from "@/lib/query";

export function useReservation(reference: string | null, token: string | null) {
  return useQuery({
    queryKey: queryKeys.reservation(reference ?? ""),
    queryFn: ({ signal }) => getReservation(reference!, token!, signal),
    enabled: Boolean(reference && token),
    staleTime: 30_000,
  });
}
