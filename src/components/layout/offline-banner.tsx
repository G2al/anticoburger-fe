"use client";

import { WifiOff } from "lucide-react";
import { AnimatePresence, m } from "motion/react";
import { useOnlineStatus } from "@/hooks/use-online-status";

export function OfflineBanner() {
  const online = useOnlineStatus();

  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center pt-safe">
      <AnimatePresence>
        {!online && (
          <m.div
            initial={{ y: -16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -16, opacity: 0 }}
            className="pointer-events-auto mx-4 mt-2 flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground shadow-lg"
          >
            <WifiOff className="size-4 shrink-0" aria-hidden />
            Sei offline: prenotazioni e annullamenti non sono disponibili.
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
