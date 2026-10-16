"use client";

import { useQueryClient } from "@tanstack/react-query";
import { ArrowRight, CalendarX2 } from "lucide-react";
import { m } from "motion/react";
import type { ReactNode } from "react";
import { ErrorState, OfflineState } from "@/components/common/error-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAvailability } from "@/hooks/use-availability";
import { describeError, isApiError } from "@/lib/api/errors";
import { formatLongDate, pluralizePeople } from "@/lib/date";
import { queryKeys } from "@/lib/query";
import { SelectableChip } from "./selectable-chip";
import { StepHeader } from "./step-header";
import { StepLayout } from "./step-layout";

/** Raggruppamento solo visivo: gli orari arrivano sempre dalle API. */
function groupSlots(slots: string[]) {
  const lunch = slots.filter((slot) => slot < "17:00");
  const dinner = slots.filter((slot) => slot >= "17:00");
  return [
    { label: "Pranzo", slots: lunch },
    { label: "Cena", slots: dinner },
  ].filter((group) => group.slots.length > 0);
}

const listVariants = { hidden: {}, show: { transition: { staggerChildren: 0.02 } } };
const itemVariants = { hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0 } };

export function TimeStep({
  date,
  partySize,
  selectedTime,
  onSelect,
  onContinue,
  onBack,
  notice,
  focusTitle,
}: {
  date: string;
  partySize: number;
  selectedTime: string | null;
  onSelect: (time: string) => void;
  onContinue: () => void;
  onBack: () => void;
  notice?: ReactNode;
  focusTitle: boolean;
}) {
  const queryClient = useQueryClient();
  const availability = useAvailability(date, partySize);
  const slots = availability.data?.slots;
  const validSelection = selectedTime && slots?.includes(selectedTime) ? selectedTime : null;

  function pickAnotherDay() {
    // Il calendario diceva "disponibile": va riletto.
    void queryClient.invalidateQueries({ queryKey: queryKeys.calendarAll });
    onBack();
  }

  const header = (
    <StepHeader
      index={2}
      title="Scegli l'orario"
      description={`${formatLongDate(date)} · ${pluralizePeople(partySize)}`}
      onBack={onBack}
      focusOnMount={focusTitle}
    />
  );

  return (
    <StepLayout
      header={header}
      notice={notice}
      actions={
        slots?.length ? (
          <Button size="xl" disabled={!validSelection} onClick={onContinue}>
            Continua
            <ArrowRight aria-hidden data-icon="inline-end" />
          </Button>
        ) : undefined
      }
    >
      {slots && slots.length === 0 ? (
        <EmptyDay onPickAnotherDay={pickAnotherDay} message="Non ci sono più orari liberi in questa data." />
      ) : slots ? (
        <div className="flex flex-col gap-6">
          {groupSlots(slots).map((group) => (
            <div key={group.label} className="flex flex-col gap-3">
              <h2 id={`slots-${group.label}`} className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
                {group.label}
              </h2>
              <m.div
                role="group"
                aria-labelledby={`slots-${group.label}`}
                className="grid grid-cols-3 gap-2.5 min-[400px]:grid-cols-4"
                variants={listVariants}
                initial="hidden"
                animate="show"
              >
                {group.slots.map((slot) => (
                  <m.div key={slot} variants={itemVariants}>
                    <SelectableChip
                      selected={validSelection === slot}
                      indicatorId="time-indicator"
                      onClick={() => onSelect(slot)}
                      className="h-12 w-full"
                      aria-label={`Ore ${slot}`}
                    >
                      {slot}
                    </SelectableChip>
                  </m.div>
                ))}
              </m.div>
            </div>
          ))}
        </div>
      ) : isApiError(availability.error) && availability.error.code === "DATE_OUT_OF_RANGE" ? (
        <EmptyDay onPickAnotherDay={pickAnotherDay} message={describeError(availability.error).message} />
      ) : availability.isError ? (
        <ErrorState
          error={availability.error}
          onRetry={() => availability.refetch()}
          retrying={availability.isFetching}
        />
      ) : availability.fetchStatus === "paused" ? (
        <OfflineState />
      ) : (
        <TimeSkeleton />
      )}
    </StepLayout>
  );
}

function EmptyDay({ message, onPickAnotherDay }: { message: string; onPickAnotherDay: () => void }) {
  return (
    <div role="status" className="flex flex-col items-center gap-4 rounded-3xl bg-muted/60 px-6 py-8 text-center">
      <CalendarX2 className="size-7 text-brass" aria-hidden />
      <p className="max-w-xs text-pretty">{message}</p>
      <Button variant="outline" size="lg" onClick={onPickAnotherDay}>
        Scegli un altro giorno
      </Button>
    </div>
  );
}

export function TimeSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-busy="true" aria-label="Caricamento degli orari">
      <Skeleton className="h-4 w-16 rounded-md" />
      <div className="grid grid-cols-3 gap-2.5 min-[400px]:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton key={i} className="h-12" />
        ))}
      </div>
    </div>
  );
}
