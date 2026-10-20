import { ArrowRight, UtensilsCrossed } from "lucide-react";
import Link from "next/link";
import { ContactRestaurant } from "@/components/common/contact-restaurant";
import { BookingHours } from "@/components/home/booking-hours";
import { AppShell } from "@/components/layout/app-shell";
import { BottomActionBar } from "@/components/layout/bottom-action-bar";
import { Wordmark } from "@/components/layout/wordmark";
import { InstallPromptLoader } from "@/components/pwa/install-prompt-loader";
import { NextReservationCard } from "@/components/reservation/my-reservations";
import { buttonVariants } from "@/components/ui/button";
import { restaurant } from "@/config/restaurant";

export default function HomePage() {
  return (
    <AppShell>
      <main className="flex flex-1 flex-col">
        {/* Gruppo centrato in verticale: sugli schermi alti lo spazio libero si divide sopra e sotto. */}
        <div className="flex flex-1 flex-col justify-center gap-10 px-safe py-10 sm:px-8 sm:py-12">
          <div className="flex flex-col items-center gap-8 text-center">
            <Wordmark width={232} preload />
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

          <NextReservationCard />

          <InstallPromptLoader />

          <section aria-labelledby="info-title" className="flex flex-col gap-4 rounded-3xl bg-card p-5 ring-1 ring-border sm:bg-muted/50 sm:ring-0">
            <h2 id="info-title" className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
              {restaurant.name}
            </h2>
            <BookingHours />
            <ContactRestaurant />
          </section>
        </div>

        <BottomActionBar>
          <Link href="/menu" className={buttonVariants({ variant: "outline", size: "xl" })}>
            <UtensilsCrossed aria-hidden data-icon="inline-start" />
            Scopri il menu
          </Link>
          <Link href="/prenota" className={buttonVariants({ size: "xl" })}>
            Prenota un tavolo
            <ArrowRight aria-hidden data-icon="inline-end" />
          </Link>
        </BottomActionBar>
      </main>
    </AppShell>
  );
}
