"use client";

import { useQuery } from "@tanstack/react-query";
import { getAvailability } from "@/lib/api/endpoints";
import { AVAILABILITY_STALE_TIME, queryKeys } from "@/lib/query";

export function availabilityQuery(date: string, partySize: number) {
  return {
    queryKey: queryKeys.availability(date, partySize),
    queryFn: ({ signal }: { signal: AbortSignal }) => getAvailability(date, partySize, signal),
    staleTime: AVAILABILITY_STALE_TIME,
  };
}

export function useAvailability(date: string | null, partySize: number | null) {
  return useQuery({
    ...availabilityQuery(date ?? "", partySize ?? 0),
    enabled: date !== null && partySize !== null,
  });
}
