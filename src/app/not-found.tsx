import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Wordmark } from "@/components/layout/wordmark";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <AppShell>
      <main className="flex flex-1 flex-col items-center justify-center gap-6 px-safe py-12 text-center sm:px-8">
        <Wordmark width={160} />
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold">Pagina non trovata</h1>
          <p className="mx-auto max-w-xs text-pretty text-muted-foreground">
            La pagina che cerchi non esiste o è stata spostata.
          </p>
        </div>
        <Link href="/" className={buttonVariants({ size: "lg" })}>
          Torna alla home
        </Link>
      </main>
    </AppShell>
  );
}
