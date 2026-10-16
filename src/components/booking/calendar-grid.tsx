"use client";

import { m } from "motion/react";
import { useRef, useState, type KeyboardEvent } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import type { CalendarDay, CalendarDayStatus } from "@/lib/api/types";
import { dayOfMonth, formatLongDate, weekdayIndex } from "@/lib/date";
import { cn } from "@/lib/utils";

const WEEKDAYS = [
  ["L", "lunedì"],
  ["M", "martedì"],
  ["M", "mercoledì"],
  ["G", "giovedì"],
  ["V", "venerdì"],
  ["S", "sabato"],
  ["D", "domenica"],
] as const;

const CELLS = 42; // 6 righe fisse: nessun salto di layout tra i mesi.

export const STATUS_LABEL: Record<CalendarDayStatus, string> = {
  available: "disponibile",
  fully_booked: "completo",
  closed: "chiuso",
  not_bookable: "non prenotabile",
};

const STATUS_CLASS: Record<CalendarDayStatus, string> = {
  available: "bg-card font-semibold text-foreground ring-1 ring-border hover:ring-foreground/30",
  fully_booked: "text-muted-foreground line-through decoration-brass decoration-[1.5px]",
  closed: "bg-muted text-muted-foreground",
  not_bookable: "text-muted-foreground/50",
};

export function CalendarGrid({
  days,
  labelId,
  selectedDate,
  today,
  onSelect,
  onUnavailable,
}: {
  days: CalendarDay[];
  labelId: string;
  selectedDate: string | null;
  today: string;
  onSelect: (date: string) => void;
  onUnavailable: (day: CalendarDay) => void;
}) {
  const offset = days.length ? weekdayIndex(days[0].date) : 0;
  const cells: (CalendarDay | null)[] = Array.from({ length: CELLS }, (_, i) => days[i - offset] ?? null);
  const rows = Array.from({ length: CELLS / 7 }, (_, r) => cells.slice(r * 7, r * 7 + 7));

  const defaultFocus =
    days.find((day) => day.date === selectedDate)?.date ??
    days.find((day) => day.status === "available")?.date ??
    days[0]?.date;
  const [focused, setFocused] = useState<string | undefined>(defaultFocus);
  const focusedDate = days.some((day) => day.date === focused) ? focused : defaultFocus;
  const buttons = useRef(new Map<string, HTMLButtonElement>());

  function moveFocus(from: string, delta: number) {
    const index = days.findIndex((day) => day.date === from) + delta;
    const target = days[Math.min(Math.max(index, 0), days.length - 1)];
    if (!target) return;
    setFocused(target.date);
    buttons.current.get(target.date)?.focus();
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, date: string) {
    const weekday = weekdayIndex(date);
    const deltas: Record<string, number> = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -7,
      ArrowDown: 7,
      Home: -weekday,
      End: 6 - weekday,
    };
    if (event.key in deltas) {
      event.preventDefault();
      moveFocus(date, deltas[event.key]);
    }
  }

  return (
    <div role="grid" aria-labelledby={labelId} className="-mx-2 flex flex-col gap-1">
      <div role="row" className="grid grid-cols-7 gap-0.5 min-[400px]:gap-1">
        {WEEKDAYS.map(([short, long]) => (
          <div
            key={long}
            role="columnheader"
            aria-label={long}
            className="flex h-7 items-center justify-center text-xs font-medium text-muted-foreground uppercase"
          >
            {short}
          </div>
        ))}
      </div>
      {rows.map((row, r) => (
        <div role="row" key={r} className="grid grid-cols-7 gap-0.5 min-[400px]:gap-1">
          {row.map((day, c) => {
            if (!day) return <div role="gridcell" key={c} className="h-11" />;
            const selected = day.date === selectedDate && day.status === "available";
            const available = day.status === "available";
            return (
              <div role="gridcell" key={day.date} aria-selected={selected}>
                <button
                  ref={(node) => {
                    if (node) buttons.current.set(day.date, node);
                    else buttons.current.delete(day.date);
                  }}
                  type="button"
                  tabIndex={day.date === focusedDate ? 0 : -1}
                  aria-disabled={!available}
                  aria-current={day.date === today ? "date" : undefined}
                  aria-label={`${formatLongDate(day.date)}, ${STATUS_LABEL[day.status]}`}
                  onFocus={() => setFocused(day.date)}
                  onKeyDown={(event) => onKeyDown(event, day.date)}
                  onClick={() => (available ? onSelect(day.date) : onUnavailable(day))}
                  className={cn(
                    "relative isolate flex h-11 w-full cursor-pointer flex-col items-center justify-center rounded-xl text-[15px] tabular transition-[color,box-shadow,transform] duration-150 outline-none",
                    "focus-visible:ring-3 focus-visible:ring-ring/40",
                    available && "active:scale-[0.94] motion-reduce:active:scale-100",
                    !available && "cursor-default",
                    STATUS_CLASS[day.status],
                    selected && "text-primary-foreground ring-0",
                  )}
                >
                  {selected && (
                    <m.span
                      layoutId="day-indicator"
                      className="absolute inset-0 -z-10 rounded-[inherit] bg-primary"
                      transition={{ type: "spring", stiffness: 520, damping: 38 }}
                      aria-hidden
                    />
                  )}
                  {dayOfMonth(day.date)}
                  {day.date === today && (
                    <span
                      className={cn(
                        "absolute bottom-1 size-1 rounded-full",
                        selected ? "bg-primary-foreground" : "bg-brass",
                      )}
                      aria-hidden
                    />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

export function CalendarSkeleton() {
  return (
    <div className="-mx-2 flex flex-col gap-1" aria-busy="true" aria-label="Caricamento del calendario">
      <div className="grid grid-cols-7 gap-0.5 min-[400px]:gap-1">
        {WEEKDAYS.map(([short, long]) => (
          <div key={long} className="flex h-7 items-center justify-center text-xs font-medium text-muted-foreground" aria-hidden>
            {short}
          </div>
        ))}
      </div>
      {Array.from({ length: CELLS / 7 }, (_, r) => (
        <div key={r} className="grid grid-cols-7 gap-0.5 min-[400px]:gap-1">
          {Array.from({ length: 7 }, (_, c) => (
            <Skeleton key={c} className="h-11 rounded-xl" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CalendarLegend() {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground" aria-label="Legenda">
      <li className="flex items-center gap-1.5">
        <span className="size-3 rounded-[4px] bg-card ring-1 ring-border" aria-hidden />
        Disponibile
      </li>
      <li className="flex items-center gap-1.5">
        <span className="text-[11px] font-medium line-through decoration-brass decoration-[1.5px]" aria-hidden>
          12
        </span>
        Completo
      </li>
      <li className="flex items-center gap-1.5">
        <span className="size-3 rounded-[4px] bg-muted ring-1 ring-border/60" aria-hidden />
        Chiuso
      </li>
    </ul>
  );
}
