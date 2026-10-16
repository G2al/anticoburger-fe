"use client";

import { useQuery } from "@tanstack/react-query";
import { getCalendar } from "@/lib/api/endpoints";
import { AVAILABILITY_STALE_TIME, queryKeys } from "@/lib/query";

export function calendarQuery(month: string, partySize: number) {
  return {
    queryKey: queryKeys.calendar(month, partySize),
    queryFn: ({ signal }: { signal: AbortSignal }) => getCalendar(month, partySize, signal),
    staleTime: AVAILABILITY_STALE_TIME,
  };
}

export function useCalendar(month: string, partySize: number | null) {
  return useQuery({
    ...calendarQuery(month, partySize ?? 0),
    enabled: partySize !== null,
  });
}
