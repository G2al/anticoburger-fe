"use client";

import { useQuery } from "@tanstack/react-query";
import { getBookingSettings } from "@/lib/api/endpoints";
import { queryKeys, SETTINGS_STALE_TIME } from "@/lib/query";

export function bookingSettingsQuery() {
  return {
    queryKey: queryKeys.settings,
    queryFn: ({ signal }: { signal: AbortSignal }) => getBookingSettings(signal),
    staleTime: SETTINGS_STALE_TIME,
  };
}

export function useBookingSettings() {
  return useQuery(bookingSettingsQuery());
}
