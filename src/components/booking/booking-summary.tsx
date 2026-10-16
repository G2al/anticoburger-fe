import { CalendarDays, Clock, Users } from "lucide-react";
import { formatLongDate, pluralizePeople } from "@/lib/date";
import type { FormStep } from "./booking-draft";

/** Riepilogo della scelta sempre visibile, con scorciatoie per modificarla. */
export function BookingSummary({
  partySize,
  date,
  time,
  onEdit,
}: {
  partySize: number;
  date: string;
  time: string;
  onEdit?: (step: FormStep) => void;
}) {
  const rows = [
    { step: "party" as const, icon: Users, label: "Persone", value: pluralizePeople(partySize) },
    { step: "date" as const, icon: CalendarDays, label: "Data", value: formatLongDate(date) },
    { step: "time" as const, icon: Clock, label: "Ora", value: time },
  ];

  return (
    <dl className="divide-y divide-border overflow-hidden rounded-3xl bg-card ring-1 ring-border">
      {rows.map(({ step, icon: Icon, label, value }) => (
        <div key={step} className="flex min-h-14 items-center gap-3 px-4">
          <Icon className="size-4 shrink-0 text-brass" aria-hidden />
          <dt className="sr-only">{label}</dt>
          <dd className="flex-1 font-medium tabular">{value}</dd>
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(step)}
              className="-mr-2 min-h-11 cursor-pointer rounded-xl px-3 text-sm font-medium text-ring underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/30"
            >
              Modifica<span className="sr-only"> {label.toLocaleLowerCase("it-IT")}</span>
            </button>
          )}
        </div>
      ))}
    </dl>
  );
}
