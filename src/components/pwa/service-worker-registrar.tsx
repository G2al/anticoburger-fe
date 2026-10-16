"use client";

import { useEffect } from "react";
import { toast } from "sonner";

/**
 * Registra /sw.js solo in produzione (o con NEXT_PUBLIC_ENABLE_SW=true).
 * La versione nell'URL cambia a ogni build: il browser riconosce così il nuovo service worker.
 */
const ENABLED = process.env.NODE_ENV === "production" || process.env.NEXT_PUBLIC_ENABLE_SW === "true";
const VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? "dev";

export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (!ENABLED || !("serviceWorker" in navigator)) return;

    let refreshing = false;
    const onControllerChange = () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    };

    function promptUpdate(worker: ServiceWorker) {
      toast("Nuova versione disponibile", {
        id: "sw-update",
        duration: Infinity,
        action: {
          label: "Aggiorna",
          onClick: () => {
            navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);
            worker.postMessage({ type: "SKIP_WAITING" });
          },
        },
      });
    }

    navigator.serviceWorker
      .register(`/sw.js?v=${encodeURIComponent(VERSION)}`, { scope: "/", updateViaCache: "none" })
      .then((registration) => {
        // Solo se c'è già un controller si tratta di un aggiornamento, non della prima installazione.
        if (registration.waiting && navigator.serviceWorker.controller) promptUpdate(registration.waiting);
        registration.addEventListener("updatefound", () => {
          const worker = registration.installing;
          worker?.addEventListener("statechange", () => {
            if (worker.state === "installed" && navigator.serviceWorker.controller) promptUpdate(worker);
          });
        });
      })
      .catch(() => {
        // Senza service worker l'app funziona comunque online.
      });

    return () => navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
  }, []);

  return null;
}
