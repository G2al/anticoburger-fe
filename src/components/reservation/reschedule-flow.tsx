"use client";

import { useQueryClient } from "@tanstack/react-query";
import { ArrowDown, Loader2 } from "lucide-react";
import { useState, type ReactNode } from "react";
import { DateStep } from "@/components/booking/date-step";
import { PartySizeStep } from "@/components/booking/party-size-step";
import { StepHeader } from "@/components/booking/step-header";
import { StepLayout } from "@/components/booking/step-layout";
import { StepTransition } from "@/components/booking/step-transition";
import { TimeStep } from "@/components/booking/time-step";
import { Notice } from "@/components/common/notice";
import { Button } from "@/components/ui/button";
import { availabilityQuery, useAvailability } from "@/hooks/use-availability";
import { calendarQuery } from "@/hooks/use-calendar";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { useRescheduleReservation } from "@/hooks/use-reschedule-reservation";
import { describeError, isApiError } from "@/lib/api/errors";
import type { Reservation } from "@/lib/api/types";
import { formatLongDate, monthOf, pluralizePeople } from "@/lib/date";

type Step = "party" | "date" | "time" | "summary";
const ORDER: Step[] = ["party", "date", "time", "summary"];

/** Come si chiude il flusso: il dettaglio mostra l'esito. */
export type RescheduleOutcome =
  | { kind: "cancelled" }
  | { kind: "updated" }
  | { kind: "message"; title?: string; message: string; tone: "info" | "error" };

const ORIGINAL_STILL_VALID = "La tua prenotazione originale è ancora valida.";

/**
 * Modifica di una prenotazione confermata: persone → giorno → orario → riepilogo "Da → A".
 * Riusa gli step della prenotazione; nome e telefono non si modificano qui.
 */
export function RescheduleFlow({
  reservation,
  token,
  onClose,
}: {
  reservation: Reservation;
  token: string;
  onClose: (outcome: RescheduleOutcome) => void;
}) {
  const queryClient = useQueryClient();
  const online = useOnlineStatus();
  const mutation = useRescheduleReservation(reservation.reference, token);

  const [step, setStep] = useState<Step>("party");
  const [direction, setDirection] = useState<1 | -1>(1);
  const [partySize, setPartySize] = useState<number | null>(reservation.party_size);
  const [date, setDate] = useState<string | null>(reservation.date);
  const [time, setTime] = useState<string | null>(reservation.time);
  const [notice, setNotice] = useState<{ title?: string; message: string; tone: "info" | "error" } | null>(null);

  // Stessa chiave dello step orario: nessuna richiesta in più. Serve a capire se l'orario attuale è tra gli slot.
  const availability = useAvailability(step === "time" ? date : null, partySize);

  const current = `${formatLongDate(reservation.date)} alle ${reservation.time}, ${pluralizePeople(reservation.party_size)}`;
  const unchanged = partySize === reservation.party_size && date === reservation.date && time === reservation.time;

  function go(next: Step, message: typeof notice = null) {
    setDirection(ORDER.indexOf(next) >= ORDER.indexOf(step) ? 1 : -1);
    setNotice(message);
    setStep(next);
    window.scrollTo({ top: 0 });
  }

  function selectPartySize(size: number) {
    setPartySize(size);
    void queryClient.prefetchQuery(calendarQuery(date ? monthOf(date) : monthOf(reservation.date), size));
  }

  function selectDate(value: string) {
    setDate(value);
    if (partySize !== null) void queryClient.prefetchQuery(availabilityQuery(value, partySize));
  }

  function handleError(error: unknown) {
    const info = describeError(error);
    const code = isApiError(error) ? error.code : null;

    switch (code) {
      case "SLOT_NOT_AVAILABLE":
        setTime(null);
        go("time", { message: `Questo orario non è più disponibile. ${ORIGINAL_STILL_VALID}`, tone: "error" });
        return;
      case "BOOKING_TOO_SOON":
        setTime(null);
        go("time", { message: `${info.message} ${ORIGINAL_STILL_VALID}`, tone: "error" });
        return;
      case "DATE_OUT_OF_RANGE":
        setDate(null);
        setTime(null);
        go("date", { message: `${info.message} ${ORIGINAL_STILL_VALID}`, tone: "error" });
        return;
      case "PARTY_SIZE_NOT_SUPPORTED":
        go("party", { message: `${info.message} ${ORIGINAL_STILL_VALID}`, tone: "error" });
        return;
      case "VALIDATION_FAILED": {
        const fields = isApiError(error) ? error.fields : undefined;
        const details = fields ? Object.values(fields).flat().join(" ") : "";
        setNotice({ message: `${details || info.message} ${ORIGINAL_STILL_VALID}`, tone: "error" });
        return;
      }
      case "DUPLICATE_RESERVATION":
        setNotice({
          title: "Esiste già una prenotazione identica",
          message: `Hai già una prenotazione con questo telefono per lo stesso giorno, orario e numero di persone. ${ORIGINAL_STILL_VALID}`,
          tone: "error",
        });
        return;
      case "PHONE_DAILY_LIMIT_REACHED":
        setNotice({ title: "Limite giornaliero raggiunto", message: `${info.message} ${ORIGINAL_STILL_VALID}`, tone: "error" });
        return;
      case "TOO_MANY_REQUESTS":
        setNotice({ message: info.message, tone: "error" });
        return;
      case "RESERVATION_CANCELLED":
      case "RESERVATION_NOT_MODIFIABLE":
      case "RESERVATION_NOT_FOUND":
      case "RESERVATION_TOKEN_MISSING":
        onClose({ kind: "message", message: info.message, tone: "error" });
        return;
      case "NETWORK_ERROR":
      case "TIMEOUT":
        // Esito incerto: il dettaglio viene riletto (vedi hook) e mostra lo stato reale.
        onClose({
          kind: "message",
          title: "Non abbiamo ricevuto conferma della modifica",
          message: "La connessione si è interrotta. Qui sotto vedi lo stato aggiornato della tua prenotazione.",
          tone: "error",
        });
        return;
      default:
        setNotice({ message: `${info.message} ${ORIGINAL_STILL_VALID}`, tone: "error" });
    }
  }

  function confirm() {
    if (mutation.isPending || unchanged || partySize === null || !date || !time) return;
    setNotice(null);
    mutation.mutate({ date, time, party_size: partySize }, { onSuccess: () => onClose({ kind: "updated" }), onError: handleError });
  }

  const noticeNode: ReactNode = notice ? (
    <Notice tone={notice.tone} title={notice.title}>
      {notice.message}
    </Notice>
  ) : null;

  // Nello step orario: l'orario attuale può mancare tra gli slot (il suo tavolo risulta occupato da questa prenotazione).
  const currentAmongSlots =
    date === reservation.date &&
    partySize === reservation.party_size &&
    Boolean(availability.data?.slots.includes(reservation.time));
  const timeNotice: ReactNode = (
    <div className="flex flex-col gap-3">
      {noticeNode}
      {!currentAmongSlots && <Notice>Attuale: {current}</Notice>}
    </div>
  );

  return (
    <StepTransition stepKey={step} direction={direction}>
      {step === "summary" && partySize !== null && date && time ? (
        <StepLayout
          header={
            <StepHeader
              index={3}
              title="Conferma la modifica"
              description="Controlla la nuova prenotazione prima di confermare."
              onBack={() => go("time")}
              focusOnMount
            />
          }
          notice={noticeNode}
          actions={
            <>
              {!online && (
                <p className="text-center text-sm text-muted-foreground">
                  Sei offline: potrai confermare appena torna la connessione.
                </p>
              )}
              {unchanged && <p className="text-center text-sm text-muted-foreground">Non hai cambiato nulla.</p>}
              <Button
                size="xl"
                onClick={confirm}
                disabled={mutation.isPending || unchanged || !online}
                aria-busy={mutation.isPending}
              >
                {mutation.isPending && <Loader2 className="animate-spin" aria-hidden data-icon="inline-start" />}
                {mutation.isPending ? "Modifica in corso…" : "Conferma modifica"}
              </Button>
              <Button variant="ghost" size="lg" onClick={() => onClose({ kind: "cancelled" })} disabled={mutation.isPending}>
                Annulla
              </Button>
            </>
          }
        >
          <div className="flex flex-col gap-2">
            <ChangeCard label="Da" value={current} muted />
            <ArrowDown className="mx-auto size-5 text-brass" aria-hidden />
            <ChangeCard label="A" value={`${formatLongDate(date)} alle ${time}, ${pluralizePeople(partySize)}`} />
          </div>
          <p className="text-sm text-pretty text-muted-foreground">
            Il riferimento e il link di gestione restano gli stessi. Riceverai la conferma su WhatsApp.
          </p>
        </StepLayout>
      ) : step === "time" && partySize !== null && date ? (
        <TimeStep
          date={date}
          partySize={partySize}
          selectedTime={time}
          onSelect={setTime}
          onContinue={() => go("summary")}
          onBack={() => go("date")}
          notice={timeNotice}
          focusTitle
        />
      ) : step === "date" && partySize !== null ? (
        <DateStep
          partySize={partySize}
          selectedDate={date}
          onSelect={selectDate}
          onContinue={() => go("time")}
          onBack={() => go("party")}
          notice={noticeNode}
          focusTitle
        />
      ) : (
        <PartySizeStep
          selected={partySize}
          onSelect={selectPartySize}
          onContinue={() => go("date")}
          onBack={() => onClose({ kind: "cancelled" })}
          notice={noticeNode}
          focusTitle
        />
      )}
    </StepTransition>
  );
}

function ChangeCard({ label, value, muted = false }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className={muted ? "rounded-3xl bg-muted/70 px-5 py-4" : "rounded-3xl bg-card px-5 py-4 ring-1 ring-primary/30"}>
      <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{label}</p>
      <p className={muted ? "mt-1 text-muted-foreground line-through decoration-muted-foreground/40" : "mt-1 font-semibold"}>
        {value}
      </p>
    </div>
  );
}
