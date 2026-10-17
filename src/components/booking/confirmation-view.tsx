"use client";

import { BellRing, CalendarPlus, Copy, Share2 } from "lucide-react";
import { m } from "motion/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ContactRestaurant } from "@/components/common/contact-restaurant";
import { RestaurantMap } from "@/components/common/restaurant-map";
import { BottomActionBar } from "@/components/layout/bottom-action-bar";
import { Button, buttonVariants } from "@/components/ui/button";
import { formatLongDate, formatTimeOfInstant, pluralizePeople } from "@/lib/date";
import { buildManageUrl, shortReference } from "@/lib/manage-link";

export type ConfirmedBooking = {
  reference: string;
  token: string;
  date: string;
  time: string;
  party_size: number;
  first_name: string;
  starts_at?: string;
  ends_at?: string;
};

export function ConfirmationView({
  booking,
  persisted,
  onNewBooking,
}: {
  booking: ConfirmedBooking;
  /** `false` se lo storage del dispositivo non è disponibile. */
  persisted: boolean;
  onNewBooking: () => void;
}) {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const manageUrl = buildManageUrl(window.location.origin, booking.reference, booking.token);
  const [canShare] = useState(() => typeof navigator.share === "function");
  const [showLink, setShowLink] = useState(false);

  useEffect(() => {
    titleRef.current?.focus({ preventScroll: true });
  }, []);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(manageUrl);
      toast.success("Link di gestione copiato");
    } catch {
      setShowLink(true);
    }
  }

  async function share() {
    try {
      await navigator.share({
        title: "La mia prenotazione da Antico Burger",
        text: `${formatLongDate(booking.date)} alle ${booking.time}, ${pluralizePeople(booking.party_size)}.`,
        url: manageUrl,
      });
    } catch {
      // Condivisione annullata dall'utente: nessuna azione.
    }
  }

  async function addToCalendar() {
    if (!booking.starts_at || !booking.ends_at) return;
    const { downloadIcs } = await import("@/lib/ics");
    downloadIcs({
      reference: booking.reference,
      starts_at: booking.starts_at,
      ends_at: booking.ends_at,
      party_size: booking.party_size,
    });
  }

  return (
    <section className="flex flex-1 flex-col">
      <div className="flex flex-col gap-7 px-safe pb-6 sm:px-6">
        <div className="flex flex-col items-center gap-4 pt-4 text-center">
          <SuccessMark />
          <div className="flex flex-col gap-1.5">
            <h1 ref={titleRef} tabIndex={-1} className="text-[1.75rem] leading-tight font-semibold outline-none">
              Prenotazione confermata
            </h1>
            <p className="text-muted-foreground">Ti aspettiamo, {booking.first_name}.</p>
          </div>
        </div>

        <m.dl
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="divide-y divide-border rounded-3xl bg-card ring-1 ring-border"
        >
          <SummaryRow label="Data" value={formatLongDate(booking.date, { withYear: true })} />
          <SummaryRow
            label="Ora"
            value={booking.time}
            detail={booking.ends_at ? `Fine prevista alle ${formatTimeOfInstant(booking.ends_at)}` : undefined}
          />
          <SummaryRow label="Persone" value={pluralizePeople(booking.party_size)} />
          <SummaryRow label="Riferimento" value={shortReference(booking.reference)} mono />
        </m.dl>

        <div className="flex flex-col gap-3">
          <h2 className="font-semibold">Link di gestione</h2>
          <p className="text-pretty text-muted-foreground">
            Con questo link personale puoi consultare o annullare la prenotazione. Conservalo e non condividerlo con
            estranei: per sicurezza non possiamo recuperarlo né rigenerarlo. Il riferimento qui sopra serve solo per
            parlare con il ristorante.
          </p>
          <div className="grid grid-cols-1 gap-2 min-[400px]:grid-cols-2">
            <Button variant="outline" size="lg" onClick={copyLink}>
              <Copy aria-hidden data-icon="inline-start" />
              Copia link di gestione
            </Button>
            {canShare && (
              <Button variant="outline" size="lg" onClick={share}>
                <Share2 aria-hidden data-icon="inline-start" />
                Condividi
              </Button>
            )}
            {booking.starts_at && booking.ends_at && (
              <Button variant="outline" size="lg" onClick={addToCalendar} className="min-[400px]:col-span-2">
                <CalendarPlus aria-hidden data-icon="inline-start" />
                Aggiungi al calendario
              </Button>
            )}
          </div>
          {showLink && (
            <label className="flex flex-col gap-1 text-sm">
              Copia il link manualmente:
              <input
                readOnly
                value={manageUrl}
                onFocus={(event) => event.currentTarget.select()}
                className="h-11 rounded-xl border bg-card px-3 text-sm"
              />
            </label>
          )}
        </div>

        <RestaurantMap />

        {/* Promemoria finale in stile notifica: informativo, non un avviso di pericolo. */}
        <div role="note" className="flex gap-3 rounded-3xl bg-accent px-4 py-4 text-sm text-accent-foreground">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-card shadow-sm ring-1 ring-brass/30">
            <BellRing className="size-4 text-brass" aria-hidden />
          </span>
          <div className="flex flex-col gap-2 pt-1">
            <p>
              {persisted
                ? "La prenotazione è salvata su questo dispositivo. "
                : "Questo browser non permette di salvare la prenotazione sul dispositivo: copia subito il link. "}
              Senza il link o questo dispositivo, per annullare dovrai contattare il ristorante.
            </p>
            <ContactRestaurant compact />
          </div>
        </div>
      </div>

      <BottomActionBar>
        <Link href="/prenotazioni" className={buttonVariants({ size: "xl" })}>
          Le mie prenotazioni
        </Link>
        <Button variant="ghost" size="lg" onClick={onNewBooking}>
          Nuova prenotazione
        </Button>
      </BottomActionBar>
    </section>
  );
}

function SummaryRow({ label, value, detail, mono }: { label: string; value: string; detail?: string; mono?: boolean }) {
  return (
    <div className="flex min-h-14 items-center justify-between gap-4 px-4 py-3">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="flex flex-col items-end text-right">
        <span className={mono ? "font-semibold tabular tracking-[0.14em]" : "font-medium tabular"}>{value}</span>
        {detail && <span className="text-sm text-muted-foreground tabular">{detail}</span>}
      </dd>
    </div>
  );
}

function SuccessMark() {
  return (
    <m.svg
      viewBox="0 0 64 64"
      className="size-18 text-primary"
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 380, damping: 22 }}
      aria-hidden
    >
      <circle cx="32" cy="32" r="32" className="fill-primary" />
      <m.path
        d="M20 33.5 28.5 42 45 24"
        fill="none"
        stroke="var(--primary-foreground)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 0.15, duration: 0.3, ease: "easeOut" }}
      />
    </m.svg>
  );
}
