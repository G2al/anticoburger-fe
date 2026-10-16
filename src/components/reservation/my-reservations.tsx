"use client";

import { CalendarDays, ChevronRight, X } from "lucide-react";
import { m } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useHydrated } from "@/hooks/use-hydrated";
import { useStoredReservations } from "@/hooks/use-stored-reservations";
import { formatLongDate, isPast, pluralizePeople } from "@/lib/date";
import { buildLocalManageHref } from "@/lib/manage-link";
import {
  removePastReservations,
  removeStoredReservation,
  restoreStoredReservation,
  type StoredReservation,
} from "@/lib/reservation-storage";
import { ReservationStatusBadge } from "./reservation-details";

export function MyReservations() {
  const hydrated = useHydrated();
  return hydrated ? <MyReservationsClient /> : <ListSkeleton />;
}

const listVariants = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } };
const itemVariants = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };

function MyReservationsClient() {
  const reservations = useStoredReservations();
  const [now] = useState(() => new Date());
  const future = reservations.filter((item) => !isPast(item.date, item.time, now));
  const upcoming = future.filter((item) => item.status === "confirmed");
  const cancelled = future.filter((item) => item.status === "cancelled");
  const pastCount = reservations.length - future.length;

  if (future.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-3xl bg-muted/60 px-6 py-8 text-center">
        <CalendarDays className="size-7 text-brass" aria-hidden />
        <p className="max-w-xs text-pretty text-muted-foreground">
          Non ci sono prenotazioni future salvate su questo dispositivo.
        </p>
        <Link href="/prenota" className={buttonVariants({ size: "lg" })}>
          Prenota un tavolo
        </Link>
        {pastCount > 0 && <RemovePastButton count={pastCount} />}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {upcoming.length > 0 ? (
        <ReservationSection title="Prossime" items={upcoming} />
      ) : (
        <p className="text-muted-foreground">Nessuna prenotazione attiva.</p>
      )}
      {cancelled.length > 0 && (
        <ReservationSection
          title="Annullate"
          description="Puoi toglierle dall'elenco: restano comunque annullate presso il ristorante."
          items={cancelled}
          removable
        />
      )}
      <p className="text-sm text-pretty text-muted-foreground">
        L&apos;elenco è salvato solo su questo dispositivo e il browser potrebbe cancellarlo: conserva anche i link di
        gestione.
      </p>
      {pastCount > 0 && <RemovePastButton count={pastCount} />}
    </div>
  );
}

function ReservationSection({
  title,
  description,
  items,
  removable = false,
}: {
  title: string;
  description?: string;
  items: StoredReservation[];
  removable?: boolean;
}) {
  return (
    <section aria-label={title} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h2 className="text-sm font-medium tracking-wide text-muted-foreground uppercase">{title}</h2>
        {description && <p className="text-sm text-pretty text-muted-foreground">{description}</p>}
      </div>
      <m.ul className="flex flex-col gap-3" variants={listVariants} initial="hidden" animate="show">
        {items.map((item) => (
          <m.li key={item.reference} variants={itemVariants} className="flex items-center gap-2">
            {/* Nelle annullate il titolo della sezione basta: senza badge la riga resta compatta accanto alla X. */}
            <ReservationCard reservation={item} showBadge={!removable} />
            {removable && <RemoveCancelledButton reservation={item} />}
          </m.li>
        ))}
      </m.ul>
    </section>
  );
}

function ReservationCard({ reservation, showBadge = true }: { reservation: StoredReservation; showBadge?: boolean }) {
  return (
    // <a> e non <Link>: la pagina di gestione legge il frammento al caricamento, serve una navigazione completa.
    <a
      href={buildLocalManageHref(reservation.reference)}
      className="flex min-h-18 flex-1 items-center gap-4 rounded-3xl bg-card px-4 py-3 ring-1 ring-border transition-[box-shadow,transform] outline-none hover:ring-foreground/20 focus-visible:ring-3 focus-visible:ring-ring/40 active:scale-[0.99]"
    >
      <div className="flex flex-1 flex-col gap-0.5">
        <span className={reservation.status === "cancelled" ? "font-semibold text-muted-foreground" : "font-semibold"}>
          {formatLongDate(reservation.date)}
        </span>
        <span className="text-sm text-muted-foreground tabular">
          Ore {reservation.time} · {pluralizePeople(reservation.party_size)}
        </span>
      </div>
      {showBadge && <ReservationStatusBadge status={reservation.status} />}
      <ChevronRight className="size-5 text-muted-foreground" aria-hidden />
    </a>
  );
}

/** Rimozione immediata di un'annullata, con "Annulla" nel toast al posto di una conferma. */
function RemoveCancelledButton({ reservation }: { reservation: StoredReservation }) {
  function remove() {
    removeStoredReservation(reservation.reference);
    toast("Rimossa dall'elenco", {
      description: "Resta annullata presso il ristorante.",
      action: { label: "Annulla", onClick: () => restoreStoredReservation(reservation) },
    });
  }

  return (
    <Button
      variant="ghost"
      size="icon-lg"
      onClick={remove}
      aria-label={`Rimuovi dall'elenco la prenotazione annullata di ${formatLongDate(reservation.date).toLocaleLowerCase("it-IT")} alle ${reservation.time}`}
    >
      <X className="size-5" aria-hidden />
    </Button>
  );
}

function RemovePastButton({ count }: { count: number }) {
  return (
    <Button variant="ghost" size="lg" onClick={() => removePastReservations()} className="self-center">
      Rimuovi {count === 1 ? "1 prenotazione passata" : `${count} prenotazioni passate`}
    </Button>
  );
}

function ListSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-busy="true" aria-label="Caricamento">
      <Skeleton className="h-18 rounded-3xl" />
      <Skeleton className="h-18 rounded-3xl" />
    </div>
  );
}

/** Link "Le mie prenotazioni" in home, visibile solo se ci sono prenotazioni future sul dispositivo. */
export function MyReservationsShortcut() {
  const hydrated = useHydrated();
  return hydrated ? <MyReservationsShortcutClient /> : null;
}

function MyReservationsShortcutClient() {
  const reservations = useStoredReservations();
  const [now] = useState(() => new Date());
  const upcoming = reservations.filter((item) => item.status === "confirmed" && !isPast(item.date, item.time, now));
  if (upcoming.length === 0) return null;

  return (
    <m.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
      <Link href="/prenotazioni" className={buttonVariants({ variant: "outline", size: "xl" })}>
        Le mie prenotazioni
        <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground tabular">
          {upcoming.length}
        </span>
      </Link>
    </m.div>
  );
}
