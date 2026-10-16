"use client";

import { Share, SquarePlus, X } from "lucide-react";
import { AnimatePresence, m } from "motion/react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { readItem, writeItem } from "@/lib/safe-storage";

const DISMISSED_KEY = "ab:install-dismissed:v1";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIos() {
  const ua = navigator.userAgent;
  // iPadOS si presenta come Mac con touch.
  return /iPad|iPhone|iPod/.test(ua) || (ua.includes("Macintosh") && navigator.maxTouchPoints > 1);
}

/**
 * Invito discreto all'installazione, mostrato una sola volta.
 * Android/Chrome: `beforeinstallprompt`. iOS Safari non lo supporta: istruzioni manuali.
 */
export default function InstallPrompt() {
  const [mode, setMode] = useState<"android" | "ios" | null>(() =>
    !isStandalone() && !readItem("local", DISMISSED_KEY) && isIos() ? "ios" : null,
  );
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (isStandalone() || readItem("local", DISMISSED_KEY)) return;
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
      setMode("android");
    };
    const onInstalled = () => setMode(null);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  function dismiss() {
    writeItem("local", DISMISSED_KEY, "1");
    setMode(null);
  }

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    dismiss();
  }

  return (
    <AnimatePresence>
      {mode && (
        <m.aside
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          aria-label="Installa l'app"
          className="relative flex flex-col gap-2 rounded-3xl bg-card p-4 pr-12 text-sm ring-1 ring-border"
        >
          <p className="font-medium">Aggiungi Antico Burger alla schermata Home</p>
          {mode === "ios" ? (
            <p className="text-muted-foreground">
              In Safari tocca <Share className="inline size-4 align-text-bottom" aria-label="Condividi" /> e poi{" "}
              <span className="whitespace-nowrap">
                <SquarePlus className="inline size-4 align-text-bottom" aria-hidden /> «Aggiungi alla schermata Home»
              </span>
              .
            </p>
          ) : (
            <div className="flex items-center gap-3">
              <p className="flex-1 text-muted-foreground">Prenota più in fretta, come un&apos;app.</p>
              <Button size="lg" onClick={install}>
                Installa
              </Button>
            </div>
          )}
          <Button variant="ghost" size="icon-lg" onClick={dismiss} aria-label="Chiudi" className="absolute top-1 right-1">
            <X className="size-4" aria-hidden />
          </Button>
        </m.aside>
      )}
    </AnimatePresence>
  );
}
