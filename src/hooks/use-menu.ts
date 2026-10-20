"use client";

import { useQuery } from "@tanstack/react-query";
import { getMenu } from "@/lib/api/endpoints";
import { MENU_STALE_TIME, queryKeys } from "@/lib/query";

/** Menu dal backend. Nessun retry sui 4xx (default del QueryClient), quindi neanche sul 429. */
export function useMenu() {
  return useQuery({
    queryKey: queryKeys.menu,
    queryFn: ({ signal }) => getMenu(signal),
    staleTime: MENU_STALE_TIME,
  });
}
