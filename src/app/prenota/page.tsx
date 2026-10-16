import type { Metadata } from "next";
import { BookingFlow } from "@/components/booking/booking-flow";
import { AppShell } from "@/components/layout/app-shell";
import { Header } from "@/components/layout/header";

export const metadata: Metadata = {
  title: "Prenota un tavolo",
};

export default function BookingPage() {
  return (
    <AppShell>
      {/* Il "indietro" è nello step: allo step 1 riporta alla home. */}
      <Header />
      <main className="flex flex-1 flex-col">
        <BookingFlow />
      </main>
    </AppShell>
  );
}
