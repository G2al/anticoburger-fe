"use client";

import dynamic from "next/dynamic";
import { useHydrated } from "@/hooks/use-hydrated";

// Import dinamico: il codice dell'invito non serve al primo caricamento.
const InstallPrompt = dynamic(() => import("./install-prompt"), { ssr: false });

export function InstallPromptLoader() {
  const hydrated = useHydrated();
  return hydrated ? <InstallPrompt /> : null;
}
