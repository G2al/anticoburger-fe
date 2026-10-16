import { ArrowRight, Clock } from "lucide-react";
import Link from "next/link";
import { ContactRestaurant } from "@/components/common/contact-restaurant";
import { AppShell } from "@/components/layout/app-shell";
import { BottomActionBar } from "@/components/layout/bottom-action-bar";
import { Wordmark } from "@/components/layout/wordmark";
import { InstallPromptLoader } from "@/components/pwa/install-prompt-loader";
import { MyReservationsShortcut } from "@/components/reservation/my-reservations";
import { buttonVariants } from "@/components/ui/button";
import { restaurant } from "@/config/restaurant";

export default function HomePage() {
  return (
    <AppShell>
      <main className="flex flex-1 flex-col">
        <div className="flex flex-1 flex-col gap-10 px-safe pt-14 pb-6 sm:px-8 sm:pt-16">
          <div className="flex flex-col items-center gap-8 text-center">
            <Wordmark width={232} priority />
            <div className="flex items-center gap-3 text-brass" aria-hidden>
              <span className="h-px w-10 bg-current" />
              <span className="size-1 rotate-45 bg-current" />
              <span className="h-px w-10 bg-current" />
            </div>
            <div className="flex flex-col gap-3">
              <h1 className="text-[2rem] leading-tight font-semibold">Il tuo tavolo ti aspetta</h1>
              <p className="mx-auto max-w-xs text-pretty text-muted-foreground">
                Scegli giorno, orario e numero di persone: la conferma arriva subito, senza registrazione.
              </p>
            </div>
          </div>

          <InstallPromptLoader />

          <section aria-labelledby="info-title" className="mt-auto flex flex-col gap-4 rounded-3xl bg-card p-5 ring-1 ring-border sm:bg-muted/50 sm:ring-0">
            <h2 id="info-title" className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
              {restaurant.name}
            </h2>
            <ul className="flex flex-col gap-1.5 text-sm">
              {restaurant.openingHours.map((row) => (
                <li key={row.days} className="flex items-center justify-between gap-4">
                  <span className="flex items-center gap-2">
                    <Clock className="size-4 text-brass" aria-hidden />
                    {row.days}
                  </span>
                  <span className="text-muted-foreground tabular">{row.hours}</span>
                </li>
              ))}
            </ul>
            <ContactRestaurant />
          </section>
        </div>

        <BottomActionBar>
          <MyReservationsShortcut />
          <Link href="/prenota" className={buttonVariants({ size: "xl" })}>
            Prenota un tavolo
            <ArrowRight aria-hidden data-icon="inline-end" />
          </Link>
        </BottomActionBar>
      </main>
    </AppShell>
  );
}
