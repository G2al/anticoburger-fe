"use client";

import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useId, useState, type ReactNode } from "react";
import { ErrorState, OfflineState } from "@/components/common/error-state";
import { Notice } from "@/components/common/notice";
import { Button } from "@/components/ui/button";
import { useBookingSettings } from "@/hooks/use-booking-settings";
import { useCalendar } from "@/hooks/use-calendar";
import { isApiError } from "@/lib/api/errors";
import type { CalendarDay } from "@/lib/api/types";
import { addMonths, calendarMonthRange, formatLongDate, formatMonth, monthOf, todayInRome } from "@/lib/date";
import { CalendarGrid, CalendarLegend, CalendarSkeleton } from "./calendar-grid";
import { StepHeader } from "./step-header";
import { StepLayout } from "./step-layout";

export function DateStep({
  partySize,
  selectedDate,
  onSelect,
  onContinue,
  onBack,
  notice,
  focusTitle,
}: {
  partySize: number;
  selectedDate: string | null;
  onSelect: (date: string) => void;
  onContinue: () => void;
  onBack: () => void;
  notice?: ReactNode;
  focusTitle: boolean;
}) {
  const settings = useBookingSettings();
  const [today] = useState(() => todayInRome());
  const range = calendarMonthRange(settings.data?.max_advance_days ?? 0);

  const [month, setMonth] = useState(() => {
    const initial = selectedDate ? monthOf(selectedDate) : range.first;
    return initial < range.first || initial > range.last ? range.first : initial;
  });
  const [hint, setHint] = useState<CalendarDay | null>(null);

  const calendar = useCalendar(month, partySize);
  const days = calendar.data?.month === month ? calendar.data.days : null;
  const labelId = useId();

  const selectedStatus = days?.find((day) => day.date === selectedDate)?.status;
  const validSelection = selectedDate && monthOf(selectedDate) === month && selectedStatus === "available" ? selectedDate : null;
  const hasAvailable = days?.some((day) => day.status === "available") ?? true;
  const canGoBack = month > range.first;
  const canGoForward = month < range.last;

  function changeMonth(delta: number) {
    setHint(null);
    setMonth((current) => addMonths(current, delta));
  }

  function select(date: string) {
    setHint(null);
    onSelect(date);
  }

  return (
    <StepLayout
      header={
        <StepHeader
          index={1}
          title="Scegli il giorno"
          description="Sono selezionabili solo i giorni con tavoli liberi."
          onBack={onBack}
          focusOnMount={focusTitle}
        />
      }
      notice={notice}
      actions={
        <>
          <p className="text-center text-sm text-muted-foreground" aria-live="polite">
            {validSelection ? formatLongDate(validSelection) : "Nessun giorno selezionato"}
          </p>
          <Button size="xl" disabled={!validSelection} onClick={onContinue}>
            Continua
            <ArrowRight aria-hidden data-icon="inline-end" />
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 id={labelId} className="text-lg font-semibold" aria-live="polite">
            {formatMonth(month)}
          </h2>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon-lg"
              onClick={() => changeMonth(-1)}
              disabled={!canGoBack}
              aria-label="Mese precedente"
            >
              <ChevronLeft className="size-5" aria-hidden />
            </Button>
            <Button
              variant="ghost"
              size="icon-lg"
              onClick={() => changeMonth(1)}
              disabled={!canGoForward}
              aria-label="Mese successivo"
            >
              <ChevronRight className="size-5" aria-hidden />
            </Button>
          </div>
        </div>

        {days ? (
          <CalendarGrid
            key={month}
            days={days}
            labelId={labelId}
            selectedDate={validSelection}
            today={today}
            onSelect={select}
            onUnavailable={setHint}
          />
        ) : isApiError(calendar.error) && calendar.error.code === "MONTH_OUT_OF_RANGE" ? (
          <Notice title="Questo mese non è consultabile">
            <Button variant="link" className="h-auto p-0 text-accent-foreground underline" onClick={() => setMonth(range.first)}>
              Torna a {formatMonth(range.first).toLocaleLowerCase("it-IT")}
            </Button>
          </Notice>
        ) : calendar.isError ? (
          <ErrorState error={calendar.error} onRetry={() => calendar.refetch()} retrying={calendar.isFetching} />
        ) : calendar.fetchStatus === "paused" ? (
          <OfflineState />
        ) : (
          <CalendarSkeleton />
        )}

        {days && <CalendarLegend />}

        {hint && <UnavailableHint day={hint} days={days ?? []} onSelect={select} />}

        {days && !hasAvailable && (
          <Notice title={`Nessuna data disponibile a ${formatMonth(month).toLocaleLowerCase("it-IT")}`}>
            {canGoForward ? (
              <Button variant="link" className="h-auto p-0 text-accent-foreground underline" onClick={() => changeMonth(1)}>
                Guarda {formatMonth(addMonths(month, 1)).toLocaleLowerCase("it-IT")}
              </Button>
            ) : (
              "Al momento non ci sono altre date prenotabili online. Contatta il ristorante."
            )}
          </Notice>
        )}
      </div>
    </StepLayout>
  );
}

function UnavailableHint({
  day,
  days,
  onSelect,
}: {
  day: CalendarDay;
  days: CalendarDay[];
  onSelect: (date: string) => void;
}) {
  const label = formatLongDate(day.date);
  const reason =
    day.status === "fully_booked"
      ? `${label} è al completo.`
      : day.status === "closed"
        ? `${label} il ristorante è chiuso.`
        : `${label} non è prenotabile online.`;
  const next = days.find((candidate) => candidate.date > day.date && candidate.status === "available");

  return (
    <Notice>
      {reason}{" "}
      {next ? (
        <Button
          variant="link"
          className="h-auto p-0 text-accent-foreground underline"
          onClick={() => onSelect(next.date)}
        >
          Prima data libera: {formatLongDate(next.date).toLocaleLowerCase("it-IT")}
        </Button>
      ) : (
        "Prova un altro giorno."
      )}
    </Notice>
  );
}
