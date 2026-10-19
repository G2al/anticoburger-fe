"use client";

import { useQueryClient } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Notice } from "@/components/common/notice";
import { Skeleton } from "@/components/ui/skeleton";
import { availabilityQuery, useAvailability } from "@/hooks/use-availability";
import { useBookingSettings } from "@/hooks/use-booking-settings";
import { calendarQuery } from "@/hooks/use-calendar";
import { useHydrated } from "@/hooks/use-hydrated";
import { isApiError } from "@/lib/api/errors";
import type { CreatedReservation } from "@/lib/api/types";
import { currentMonthInRome, monthOf } from "@/lib/date";
import { onlinePartySizes } from "@/lib/party-size";
import { findStoredReservation, saveReservation } from "@/lib/reservation-storage";
import type { GuestDetails } from "@/lib/guest-details";
import { INITIAL_DRAFT, loadDraft, saveDraft, stepIndex, type BookingDraft, type FormStep, type Step } from "./booking-draft";
import type { ConfirmedBooking } from "./confirmation-view";
import { DateStep } from "./date-step";
import { PartySizeSkeleton, PartySizeStep } from "./party-size-step";
import { StepHeader } from "./step-header";
import { StepTransition } from "./step-transition";
import { TimeStep } from "./time-step";

// Form (Zod + react-hook-form) e conferma non servono al primo caricamento: import dinamici,
// precaricati mentre l'utente sceglie data e orario.
const loadDetailsStep = () => import("./details-step");
const loadConfirmationView = () => import("./confirmation-view");
const DetailsStep = dynamic(() => loadDetailsStep().then((mod) => mod.DetailsStep), {
  loading: () => <BookingFlowSkeleton />,
});
const ConfirmationView = dynamic(() => loadConfirmationView().then((mod) => mod.ConfirmationView), {
  loading: () => <BookingFlowSkeleton />,
});

/** Il flusso dipende da sessionStorage, ora corrente e dati live: si monta solo nel browser. */
export function BookingFlow() {
  const hydrated = useHydrated();
  // La shell statica mostra già il titolo del primo step: l'LCP non attende l'idratazione.
  return hydrated ? <BookingFlowClient /> : <BookingFlowSkeleton withTitle />;
}

type Confirmation = { booking: ConfirmedBooking; persisted: boolean };

function restore(): { draft: BookingDraft; confirmation: Confirmation | null } {
  const draft = loadDraft();
  if (draft.step !== "done") return { draft, confirmation: null };
  // Dopo un reload la conferma si mostra dall'archivio locale: la POST non viene ripetuta.
  const stored = draft.confirmedReference ? findStoredReservation(draft.confirmedReference) : undefined;
  return stored ? { draft, confirmation: { booking: stored, persisted: true } } : { draft: INITIAL_DRAFT, confirmation: null };
}

function BookingFlowClient() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [initial] = useState(restore);
  const [draft, setDraft] = useState(initial.draft);
  const [confirmation, setConfirmation] = useState(initial.confirmation);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [navigated, setNavigated] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  // Dopo un reload data e orario vanno ricontrollati con il backend prima di mostrare lo step.
  const [revalidating, setRevalidating] = useState(initial.draft.step !== "party" && initial.draft.step !== "done");

  useEffect(() => saveDraft(draft), [draft]);

  const settings = useBookingSettings();
  const checkSlots = revalidating && (draft.step === "time" || draft.step === "details");
  const availability = useAvailability(checkSlots ? draft.date : null, draft.partySize);

  if (revalidating) {
    const sizes = settings.data ? onlinePartySizes(settings.data.party_sizes) : undefined;
    if (settings.isError || settings.fetchStatus === "paused") {
      setRevalidating(false);
    } else if (sizes) {
      if (draft.partySize === null || !sizes.includes(draft.partySize)) {
        setDraft({ ...draft, step: "party", partySize: null, date: null, time: null });
        if (sizes.length) setNotice("Il numero di persone scelto non è più disponibile: scegli di nuovo.");
        setRevalidating(false);
      } else if (!checkSlots) {
        setRevalidating(false);
      } else if (availability.data) {
        const { slots } = availability.data;
        if (slots.length === 0) {
          setDraft({ ...draft, step: "date", date: null, time: null });
          setNotice("La data scelta non è più disponibile: scegline un'altra.");
        } else if (draft.step === "details" && (!draft.time || !slots.includes(draft.time))) {
          setDraft({ ...draft, step: "time", time: null });
          setNotice("L'orario scelto non è più disponibile: scegline un altro.");
        }
        setRevalidating(false);
      } else if (availability.isError || availability.fetchStatus === "paused") {
        if (isApiError(availability.error) && availability.error.code === "DATE_OUT_OF_RANGE") {
          setDraft({ ...draft, step: "date", date: null, time: null });
          setNotice("La data scelta non è più prenotabile: scegline un'altra.");
        }
        setRevalidating(false);
      }
    }
  }

  const updateDetails = useCallback(
    (details: GuestDetails) => setDraft((current) => ({ ...current, details })),
    [],
  );

  function go(step: Step, message: string | null = null) {
    setDirection(stepIndex(step) >= stepIndex(draft.step) ? 1 : -1);
    setNavigated(true);
    setNotice(message);
    setDraft((current) => ({ ...current, step }));
    window.scrollTo({ top: 0 });
  }

  function selectPartySize(partySize: number) {
    setDraft((current) =>
      current.partySize === partySize ? current : { ...current, partySize, date: null, time: null },
    );
    // Prefetch del calendario del mese mentre l'utente conferma la scelta.
    const month = draft.date && draft.partySize === partySize ? monthOf(draft.date) : currentMonthInRome();
    void queryClient.prefetchQuery(calendarQuery(month, partySize));
  }

  function selectDate(date: string) {
    setDraft((current) => (current.date === date ? current : { ...current, date, time: null }));
    if (draft.partySize !== null) void queryClient.prefetchQuery(availabilityQuery(date, draft.partySize));
    void loadDetailsStep();
  }

  function recover(step: FormStep, message: string) {
    setDraft((current) => ({
      ...current,
      partySize: step === "party" ? null : current.partySize,
      date: step === "party" || step === "date" ? null : current.date,
      time: null,
    }));
    go(step, message);
  }

  function confirm(created: CreatedReservation) {
    const { cancellation_token: token, ...reservation } = created;
    const persisted = saveReservation(reservation, token);
    setConfirmation({ booking: { ...reservation, token }, persisted });
    setDirection(1);
    setNotice(null);
    setDraft({ ...INITIAL_DRAFT, step: "done", confirmedReference: reservation.reference });
    window.scrollTo({ top: 0 });
  }

  function startOver() {
    setConfirmation(null);
    setDirection(-1);
    setNavigated(true);
    setDraft(INITIAL_DRAFT);
  }

  if (revalidating) return <BookingFlowSkeleton label="Verifica della disponibilità…" />;

  const noticeNode = notice ? <Notice>{notice}</Notice> : null;
  const { step, partySize, date, time } = draft;

  return (
    <StepTransition stepKey={step} direction={direction}>
      {step === "done" && confirmation ? (
        <ConfirmationView booking={confirmation.booking} persisted={confirmation.persisted} onNewBooking={startOver} />
      ) : step === "details" && partySize !== null && date && time ? (
        <DetailsStep
          selection={{ partySize, date, time }}
          defaultValues={draft.details}
          onDetailsChange={updateDetails}
          onEdit={(target) => go(target)}
          onConfirmed={confirm}
          onRecover={recover}
          notice={noticeNode}
          focusTitle={navigated}
        />
      ) : step === "time" && partySize !== null && date ? (
        <TimeStep
          date={date}
          partySize={partySize}
          selectedTime={time}
          onSelect={(value) => {
            setDraft((current) => ({ ...current, time: value }));
            void loadDetailsStep();
            void loadConfirmationView();
          }}
          onContinue={() => go("details")}
          onBack={() => go("date")}
          notice={noticeNode}
          focusTitle={navigated}
        />
      ) : step === "date" && partySize !== null ? (
        <DateStep
          partySize={partySize}
          selectedDate={date}
          onSelect={selectDate}
          onContinue={() => go("time")}
          onBack={() => go("party")}
          notice={noticeNode}
          focusTitle={navigated}
        />
      ) : (
        <PartySizeStep
          selected={partySize}
          onSelect={selectPartySize}
          onContinue={() => go("date")}
          onBack={() => router.push("/")}
          notice={noticeNode}
          focusTitle={navigated}
        />
      )}
    </StepTransition>
  );
}

/** Stesse dimensioni dello step iniziale: nessun salto quando il flusso si monta. */
export function BookingFlowSkeleton({
  label = "Caricamento…",
  withTitle = false,
}: {
  label?: string;
  withTitle?: boolean;
}) {
  return (
    <div className="flex flex-col gap-6 px-safe pb-6 sm:px-6" aria-busy="true">
      <span className="sr-only" role="status">
        {label}
      </span>
      {withTitle ? (
        <StepHeader
          index={0}
          title="Quante persone?"
          description="Scegli il numero di persone, compreso te."
          onBack={() => {}}
          focusOnMount={false}
        />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex h-11 items-center gap-3">
            <Skeleton className="h-1 flex-1 rounded-full" />
            <Skeleton className="h-3 w-10 rounded-md" />
          </div>
          <div className="flex flex-col gap-2">
            <Skeleton className="h-9 w-3/5 rounded-xl" />
            <Skeleton className="h-5 w-4/5 rounded-lg" />
          </div>
        </div>
      )}
      <PartySizeSkeleton />
    </div>
  );
}
