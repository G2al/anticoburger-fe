import { Clock } from "lucide-react";
import { restaurant } from "@/config/restaurant";
import { cn } from "@/lib/utils";

/** "Nota bene" sull'arrivo: ritardo massimo tollerato e possibile attesa al tavolo. */
export function ArrivalNotice({ className }: { className?: string }) {
  const { maxDelayMinutes, possibleWaitMinutes } = restaurant.arrival;

  return (
    <section
      aria-labelledby="arrival-title"
      className={cn("flex gap-3 rounded-3xl border-2 border-brass/40 bg-card px-4 py-4", className)}
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <Clock className="size-4" aria-hidden />
      </span>
      <div className="flex flex-col gap-2">
        <h2 id="arrival-title" className="font-semibold">
          Nota bene
        </h2>
        <ul className="flex flex-col gap-1.5 text-sm text-pretty">
          <li>
            Ti chiediamo di essere puntuale: è tollerato un ritardo massimo di{" "}
            <strong className="font-semibold">{maxDelayMinutes} minuti</strong>.
          </li>
          <li className="text-muted-foreground">
            Al tuo arrivo potrebbe esserci un&apos;attesa fino a{" "}
            <strong className="font-semibold text-foreground">{possibleWaitMinutes} minuti</strong>: non succede
            sempre, ma è bene tenerne conto.
          </li>
        </ul>
      </div>
    </section>
  );
}
