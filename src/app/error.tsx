"use client";

import { TriangleAlert } from "lucide-react";
import Link from "next/link";
import { ContactRestaurant } from "@/components/common/contact-restaurant";
import { AppShell } from "@/components/layout/app-shell";
import { Button, buttonVariants } from "@/components/ui/button";

// Nessun log dell'errore: potrebbe contenere dati della richiesta.
export default function ErrorPage({ retry }: { error: unknown; retry: () => void }) {
  return (
    <AppShell>
      <main className="flex flex-1 flex-col items-center justify-center gap-6 px-safe py-12 text-center sm:px-8">
        <TriangleAlert className="size-8 text-brass" aria-hidden />
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold">Qualcosa non ha funzionato</h1>
          <p className="mx-auto max-w-xs text-pretty text-muted-foreground">
            Si è verificato un errore imprevisto. Riprova: se il problema continua, contatta il ristorante.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Button size="lg" onClick={() => retry()}>
            Riprova
          </Button>
          <Link href="/" className={buttonVariants({ variant: "ghost", size: "lg" })}>
            Torna alla home
          </Link>
        </div>
        <ContactRestaurant compact className="items-center" />
      </main>
    </AppShell>
  );
}
