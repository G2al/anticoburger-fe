import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { Header } from "@/components/layout/header";
import { MyReservations } from "@/components/reservation/my-reservations";

export const metadata: Metadata = {
  title: "Le mie prenotazioni",
  robots: { index: false, follow: false },
};

export default function MyReservationsPage() {
  return (
    <AppShell>
      <Header backHref="/" />
      <main className="flex flex-1 flex-col gap-6 px-safe pb-10 sm:px-6">
        <div className="flex flex-col gap-1.5 pt-2">
          <h1 className="text-[1.75rem] leading-tight font-semibold">Le mie prenotazioni</h1>
          <p className="text-muted-foreground">Le prenotazioni effettuate da questo dispositivo.</p>
        </div>
        <MyReservations />
      </main>
    </AppShell>
  );
}
