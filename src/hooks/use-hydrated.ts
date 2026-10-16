"use client";

import { useSyncExternalStore } from "react";

const noop = () => () => {};

/**
 * `false` durante il prerender e l'idratazione, `true` nel browser.
 * Con Cache Components i Client Component vengono prerenderizzati: ciò che legge ora corrente,
 * storage o `location.hash` deve comparire solo dopo l'idratazione.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
}
