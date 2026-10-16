import { WifiOff } from "lucide-react";
import type { Metadata } from "next";
import { ContactRestaurant } from "@/components/common/contact-restaurant";
import { ReloadButton } from "@/components/common/reload-button";
import { AppShell } from "@/components/layout/app-shell";
import { Wordmark } from "@/components/layout/wordmark";

export const metadata: Metadata = {
  title: "Sei offline",
};

export default function OfflinePage() {
  return (
    <AppShell>
      <main className="flex flex-1 flex-col items-center justify-center gap-6 px-safe py-12 text-center sm:px-8">
        <Wordmark width={160} />
        <WifiOff className="size-8 text-brass" aria-hidden />
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold">Sei offline</h1>
          <p className="mx-auto max-w-xs text-pretty text-muted-foreground">
            Per vedere gli orari disponibili e prenotare serve una connessione a internet. Riprova appena sei di
            nuovo online.
          </p>
        </div>
        <ReloadButton />
        <ContactRestaurant compact className="items-center" />
      </main>
    </AppShell>
  );
}
