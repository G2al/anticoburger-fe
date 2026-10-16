import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { Header } from "@/components/layout/header";
import { ReservationManager } from "@/components/reservation/reservation-manager";

export const metadata: Metadata = {
  title: "La tua prenotazione",
  // Pagina personale: niente indicizzazione e nessun referrer verso l'esterno.
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default function ManageReservationPage() {
  return (
    <AppShell>
      <Header backHref="/prenotazioni" backLabel="Le mie prenotazioni" />
      <main className="flex flex-1 flex-col">
        <ReservationManager />
      </main>
    </AppShell>
  );
}
