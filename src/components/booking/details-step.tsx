"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Loader2, ShieldCheck } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { ContactRestaurant } from "@/components/common/contact-restaurant";
import { Notice } from "@/components/common/notice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCreateReservation } from "@/hooks/use-create-reservation";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { describeError, isApiError } from "@/lib/api/errors";
import type { CreatedReservation } from "@/lib/api/types";
import { buildLocalManageHref } from "@/lib/manage-link";
import { queryKeys } from "@/lib/query";
import { listStoredReservations } from "@/lib/reservation-storage";
import {
  EMPTY_GUEST_DETAILS,
  GUEST_FIELDS,
  guestDetailsSchema,
  LIMITS,
  toReservationInput,
  zodResolver,
  type GuestDetails,
} from "@/lib/validation";
import type { FormStep } from "./booking-draft";
import { BookingSummary } from "./booking-summary";
import { FormField } from "./form-field";
import { StepHeader } from "./step-header";
import { StepLayout } from "./step-layout";

const FORM_ID = "booking-details";

type Selection = { partySize: number; date: string; time: string };

type FormError =
  | { kind: "message"; title?: string; message: string; contact?: boolean }
  | { kind: "duplicate"; manageHref: string | null }
  | { kind: "uncertain" };

export function DetailsStep({
  selection,
  defaultValues,
  onDetailsChange,
  onEdit,
  onConfirmed,
  onRecover,
  notice,
  focusTitle,
}: {
  selection: Selection;
  defaultValues: GuestDetails;
  onDetailsChange: (details: GuestDetails) => void;
  onEdit: (step: FormStep) => void;
  onConfirmed: (reservation: CreatedReservation) => void;
  /** Riporta a uno step precedente conservando i dati anagrafici. */
  onRecover: (step: FormStep, message: string) => void;
  notice?: ReactNode;
  focusTitle: boolean;
}) {
  const queryClient = useQueryClient();
  const online = useOnlineStatus();
  const mutation = useCreateReservation();
  const [formError, setFormError] = useState<FormError | null>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  // Campo da mettere a fuoco dopo un VALIDATION_FAILED, appena il form torna attivo.
  const [focusField, setFocusField] = useState<keyof GuestDetails | null>(null);

  const form = useForm<GuestDetails>({
    resolver: zodResolver(guestDetailsSchema),
    defaultValues,
    mode: "onTouched",
  });
  const { errors } = form.formState;

  // I dati inseriti vengono salvati nella bozza: sopravvivono a reload e ritorni agli step precedenti.
  const { subscribe } = form;
  useEffect(
    () =>
      subscribe({
        formState: { values: true },
        callback: ({ values }) => onDetailsChange({ ...EMPTY_GUEST_DETAILS, ...values }),
      }),
    [subscribe, onDetailsChange],
  );

  useEffect(() => {
    if (formError) errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [formError]);

  function handleError(error: unknown) {
    const info = describeError(error);
    const code = isApiError(error) ? error.code : null;

    switch (code) {
      case "VALIDATION_FAILED": {
        const fields = isApiError(error) ? (error.fields ?? {}) : {};
        const guestErrors = GUEST_FIELDS.filter((field) => fields[field]?.length);
        guestErrors.forEach((field) => form.setError(field, { type: "server", message: fields[field][0] }));
        setFocusField(guestErrors[0] ?? null);
        if (guestErrors.length < Object.keys(fields).length) {
          setFormError({ kind: "message", message: "La scelta di data e orario non è valida. Ricontrollala." });
        } else {
          setFormError(null);
        }
        return;
      }
      case "SLOT_NOT_AVAILABLE":
      case "BOOKING_TOO_SOON":
        onRecover("time", info.message);
        return;
      case "DATE_OUT_OF_RANGE":
        onRecover("date", info.message);
        return;
      case "PARTY_SIZE_NOT_SUPPORTED":
        void queryClient.invalidateQueries({ queryKey: queryKeys.settings });
        onRecover("party", info.message);
        return;
      case "DUPLICATE_RESERVATION": {
        const match = listStoredReservations().find(
          (item) =>
            item.status === "confirmed" &&
            item.date === selection.date &&
            item.time === selection.time &&
            item.party_size === selection.partySize,
        );
        setFormError({ kind: "duplicate", manageHref: match ? buildLocalManageHref(match.reference) : null });
        return;
      }
      case "PHONE_DAILY_LIMIT_REACHED":
        setFormError({ kind: "message", title: "Limite giornaliero raggiunto", message: info.message, contact: true });
        return;
      case "TIMEOUT":
      case "NETWORK_ERROR":
        // Esito sconosciuto: la POST non va ripetuta automaticamente.
        setFormError({ kind: "uncertain" });
        return;
      default:
        setFormError({ kind: "message", message: info.message });
    }
  }

  const onSubmit = form.handleSubmit((values) => {
    if (mutation.isPending) return;
    setFormError(null);
    setFocusField(null);
    mutation.mutate(toReservationInput(values, selection), {
      onSuccess: onConfirmed,
      onError: handleError,
    });
  });

  const submitting = mutation.isPending;
  const { setFocus } = form;
  useEffect(() => {
    if (!submitting && focusField) setFocus(focusField);
  }, [submitting, focusField, setFocus]);
  const field = (name: keyof GuestDetails) => form.register(name);

  return (
    <StepLayout
      header={
        <StepHeader
          index={3}
          title="I tuoi dati"
          description="Ultimo passaggio: ti servono solo pochi secondi."
          onBack={() => onEdit("time")}
          focusOnMount={focusTitle}
        />
      }
      notice={notice}
      actions={
        <>
          {!online && (
            <p className="text-center text-sm text-muted-foreground">
              Sei offline: potrai confermare appena torna la connessione.
            </p>
          )}
          <Button type="submit" form={FORM_ID} size="xl" disabled={submitting || !online} aria-busy={submitting}>
            {submitting ? (
              <>
                <Loader2 className="animate-spin" aria-hidden data-icon="inline-start" />
                Invio in corso…
              </>
            ) : (
              "Conferma prenotazione"
            )}
          </Button>
        </>
      }
    >
      <BookingSummary {...selection} onEdit={onEdit} />

      <form id={FORM_ID} noValidate onSubmit={onSubmit} className="flex flex-col gap-5" aria-label="Dati per la prenotazione">
        <fieldset disabled={submitting} className="contents">
          <div className="grid gap-5 min-[420px]:grid-cols-2">
            <FormField label="Nome" error={errors.first_name?.message}>
              <Input
                {...field("first_name")}
                autoComplete="given-name"
                autoCapitalize="words"
                enterKeyHint="next"
                maxLength={LIMITS.name}
              />
            </FormField>
            <FormField label="Cognome" error={errors.last_name?.message}>
              <Input
                {...field("last_name")}
                autoComplete="family-name"
                autoCapitalize="words"
                enterKeyHint="next"
                maxLength={LIMITS.name}
              />
            </FormField>
          </div>
          <FormField label="Telefono" hint="Ti contatteremo solo in caso di necessità." error={errors.phone?.message}>
            <Input
              {...field("phone")}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              enterKeyHint="next"
              placeholder="333 123 4567"
              maxLength={LIMITS.phone}
            />
          </FormField>
          <FormField label="Email" optional error={errors.email?.message}>
            <Input
              {...field("email")}
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              enterKeyHint="next"
              maxLength={LIMITS.email}
            />
          </FormField>
          <FormField
            label="Note"
            optional
            hint="Allergie, seggiolone, occasioni speciali…"
            error={errors.notes?.message}
          >
            <Textarea {...field("notes")} rows={3} maxLength={LIMITS.notes} enterKeyHint="done" />
          </FormField>
        </fieldset>
      </form>

      <div ref={errorRef} aria-live="assertive" className="empty:hidden">
        {formError && <FormErrorNotice error={formError} />}
      </div>

      <p className="flex gap-2 text-sm text-muted-foreground">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-brass" aria-hidden />
        I tuoi dati servono solo a gestire questa prenotazione.
      </p>
    </StepLayout>
  );
}

function FormErrorNotice({ error }: { error: FormError }) {
  if (error.kind === "duplicate") {
    return (
      <Notice tone="error" title="Hai già una prenotazione identica">
        {error.manageHref ? (
          <>
            La trovi su questo dispositivo.{" "}
            <a href={error.manageHref} className="font-medium">
              Apri la prenotazione
            </a>
          </>
        ) : (
          <>
            Esiste già una prenotazione con questo telefono per lo stesso giorno, orario e numero di persone. Se non
            hai il link di gestione, contatta il ristorante.
            <ContactRestaurant compact className="mt-2" />
          </>
        )}
      </Notice>
    );
  }

  if (error.kind === "uncertain") {
    return (
      <Notice tone="error" title="Non sappiamo se la prenotazione è stata registrata">
        La connessione si è interrotta prima della risposta. Prima di riprovare, contatta il ristorante per
        verificare: se riprovi e la prenotazione esiste già, ti verrà segnalato.
        <ContactRestaurant compact className="mt-2" />
      </Notice>
    );
  }

  return (
    <Notice tone="error" title={error.title}>
      {error.message}
      {error.contact && <ContactRestaurant compact className="mt-2" />}
    </Notice>
  );
}
