"use client";

import { CalendarSearch, Link2Off, SearchX } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { ContactRestaurant } from "@/components/common/contact-restaurant";
import { ErrorState, OfflineState } from "@/components/common/error-state";
import { Notice } from "@/components/common/notice";
import { BottomActionBar } from "@/components/layout/bottom-action-bar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useHydrated } from "@/hooks/use-hydrated";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { useReservation } from "@/hooks/use-reservation";
import { describeError, isApiError } from "@/lib/api/errors";
import { isPast } from "@/lib/date";
import { buildLocalManageHref, parseManageHash } from "@/lib/manage-link";
import {
  findStoredReservation,
  removeStoredReservation,
  saveReservation,
} from "@/lib/reservation-storage";
import { ReservationDetails } from "./reservation-details";

const CancelReservationDialog = dynamic(() => import("./cancel-reservation-dialog"));

/** `ref` e `token` arrivano solo dal frammento dell'URL o dall'archivio locale. */
function readCredentials() {
  const { reference, token } = parseManageHash(window.location.hash);
  if (!reference) return { reference: null, token: null };
  return { reference, token: token ?? findStoredReservation(reference)?.token ?? null };
}

export function ReservationManager() {
  const hydrated = useHydrated();
  return hydrated ? <ReservationManagerClient /> : <ReservationSkeleton />;
}

function ReservationManagerClient() {
  const [credentials, setCredentials] = useState(readCredentials);

  useEffect(() => {
    const onHashChange = () => setCredentials(readCredentials());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const { reference, token } = credentials;

  return (
    <section className="flex flex-1 flex-col">
      <div className="flex flex-col gap-6 px-safe pb-6 sm:px-6">
        <h1 className="pt-2 text-[1.75rem] leading-tight font-semibold outline-none">
          La tua prenotazione
        </h1>
        {!reference ? (
          <EmptyState
            icon={<CalendarSearch className="size-7 text-brass" aria-hidden />}
            title="Nessuna prenotazione selezionata"
            message="Apri il link di gestione ricevuto alla conferma, oppure cerca tra le prenotazioni salvate su questo dispositivo."
          >
            <Link href="/prenotazioni" className={buttonVariants({ variant: "outline", size: "lg" })}>
              Le mie prenotazioni
            </Link>
          </EmptyState>
        ) : !token ? (
          <EmptyState
            icon={<Link2Off className="size-7 text-brass" aria-hidden />}
            title="Link incompleto"
            message="Il link non contiene il codice di gestione. Apri il link completo ricevuto alla conferma oppure contatta il ristorante."
          >
            <ContactRestaurant compact className="items-center" />
          </EmptyState>
        ) : (
          <LoadedReservation key={reference} reference={reference} token={token} />
        )}
      </div>
    </section>
  );
}

function LoadedReservation({ reference, token }: { reference: string; token: string }) {
  const online = useOnlineStatus();
  const query = useReservation(reference, token);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [alreadyCancelledNotice, setAlreadyCancelledNotice] = useState(false);
  const [now] = useState(() => new Date());
  const reservation = query.data;

  // Prenotazione valida: la si salva (o aggiorna) sul dispositivo e si toglie il token dalla barra degli indirizzi.
  useEffect(() => {
    if (!reservation) return;
    const persisted = saveReservation(reservation, token);
    if (persisted && window.location.hash.includes("token=")) {
      window.history.replaceState(window.history.state, "", buildLocalManageHref(reservation.reference));
    }
  }, [reservation, token]);

  if (query.isError) {
    const code = isApiError(query.error) ? query.error.code : null;
    if (code === "RESERVATION_NOT_FOUND" || code === "RESERVATION_TOKEN_MISSING") {
      return <NotFoundState reference={reference} message={describeError(query.error).message} />;
    }
    return <ErrorState error={query.error} onRetry={() => query.refetch()} retrying={query.isFetching} />;
  }

  if (!reservation) return query.fetchStatus === "paused" ? <OfflineState /> : <ReservationDetailsSkeleton />;

  const past = isPast(reservation.date, reservation.time, now);
  const cancelled = reservation.status === "cancelled";

  return (
    <>
      {cancelled && (
        <Notice title="Prenotazione annullata">
          {alreadyCancelledNotice
            ? "La prenotazione risulta già annullata."
            : "Questa prenotazione è stata annullata. Se vuoi, puoi prenotare di nuovo."}
        </Notice>
      )}
      <ReservationDetails reservation={reservation} past={past} />

      {!cancelled && !past && (
        <>
          <p className="text-sm text-pretty text-muted-foreground">
            Non è possibile modificare una prenotazione: per cambiare data, orario o persone annullala e prenota di
            nuovo.
          </p>
          <BottomActionBar className="-mx-5 sm:-mx-6">
            {!online && (
              <p className="text-center text-sm text-muted-foreground">
                Sei offline: potrai annullare appena torna la connessione.
              </p>
            )}
            <Button variant="destructive" size="xl" onClick={() => setDialogOpen(true)} disabled={!online}>
              Annulla prenotazione
            </Button>
          </BottomActionBar>
          {dialogOpen && (
            <CancelReservationDialog
              reservation={reservation}
              token={token}
              open={dialogOpen}
              onOpenChange={setDialogOpen}
              onCancelled={setAlreadyCancelledNotice}
            />
          )}
        </>
      )}

      {cancelled && (
        <Link href="/prenota" className={buttonVariants({ size: "xl" })}>
          Prenota di nuovo
        </Link>
      )}
    </>
  );
}

function NotFoundState({ reference, message }: { reference: string; message: string }) {
  const [stored, setStored] = useState(() => Boolean(findStoredReservation(reference)));

  return (
    <EmptyState icon={<SearchX className="size-7 text-brass" aria-hidden />} title="Prenotazione non trovata" message={message}>
      <ContactRestaurant compact className="items-center" />
      {stored && (
        <AlertDialog>
          <AlertDialogTrigger render={<Button variant="ghost" size="lg" />}>
            Rimuovi da questo dispositivo
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Rimuovere da questo dispositivo?</AlertDialogTitle>
              <AlertDialogDescription>
                La prenotazione verrà tolta dall&apos;elenco salvato su questo dispositivo. Non verrà annullata.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel size="lg">Mantieni</AlertDialogCancel>
              <AlertDialogAction
                size="lg"
                onClick={() => {
                  removeStoredReservation(reference);
                  setStored(false);
                }}
              >
                Rimuovi
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </EmptyState>
  );
}

function EmptyState({
  icon,
  title,
  message,
  children,
}: {
  icon: ReactNode;
  title: string;
  message: string;
  children?: ReactNode;
}) {
  return (
    <div role="status" className="flex flex-col items-center gap-4 rounded-3xl bg-muted/60 px-6 py-8 text-center">
      {icon}
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="max-w-sm text-pretty text-muted-foreground">{message}</p>
      {children}
    </div>
  );
}

function ReservationDetailsSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-label="Caricamento della prenotazione">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-24 rounded-lg" />
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
      <Skeleton className="h-[22rem] rounded-3xl" />
    </div>
  );
}

export function ReservationSkeleton() {
  return (
    <div className="flex flex-col gap-6 px-safe pb-6 sm:px-6">
      <Skeleton className="mt-2 h-9 w-3/5 rounded-xl" />
      <ReservationDetailsSkeleton />
    </div>
  );
}
