import { Badge } from "@/components/ui/badge";
import type { Reservation } from "@/lib/api/types";
import { formatInstant, formatLongDate, formatTimeOfInstant, pluralizePeople } from "@/lib/date";
import { shortReference } from "@/lib/manage-link";
import { cn } from "@/lib/utils";

export function ReservationStatusBadge({ status, past }: { status: Reservation["status"]; past?: boolean }) {
  if (status === "cancelled") {
    return (
      <Badge variant="destructive" className="h-6 px-2.5">
        Annullata
      </Badge>
    );
  }
  return (
    <Badge variant={past ? "secondary" : "default"} className="h-6 px-2.5">
      {past ? "Conclusa" : "Confermata"}
    </Badge>
  );
}

export function ReservationDetails({ reservation, past }: { reservation: Reservation; past: boolean }) {
  const cancelled = reservation.status === "cancelled";
  const rows: { label: string; value: string; detail?: string; mono?: boolean }[] = [
    { label: "Data", value: formatLongDate(reservation.date, { withYear: true }) },
    {
      label: "Ora",
      value: reservation.time,
      detail: cancelled ? undefined : `Fine prevista alle ${formatTimeOfInstant(reservation.ends_at)}`,
    },
    { label: "Persone", value: pluralizePeople(reservation.party_size) },
    { label: "Nome", value: `${reservation.first_name} ${reservation.last_name}` },
    { label: "Telefono", value: reservation.phone },
    ...(reservation.email ? [{ label: "Email", value: reservation.email }] : []),
    ...(reservation.notes ? [{ label: "Note", value: reservation.notes }] : []),
    { label: "Riferimento", value: shortReference(reservation.reference), mono: true },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Dettagli</h2>
        <ReservationStatusBadge status={reservation.status} past={past} />
      </div>
      {cancelled && reservation.cancelled_at && (
        <p className="text-sm text-muted-foreground">Annullata il {formatInstant(reservation.cancelled_at)}.</p>
      )}
      <dl className={cn("divide-y divide-border rounded-3xl bg-card ring-1 ring-border", cancelled && "opacity-80")}>
        {rows.map((row) => (
          <div key={row.label} className="flex min-h-13 items-start justify-between gap-4 px-4 py-3">
            <dt className="shrink-0 pt-px text-sm text-muted-foreground">{row.label}</dt>
            <dd className="flex min-w-0 flex-col items-end text-right">
              <span
                className={cn(
                  "break-words",
                  row.mono ? "font-semibold tabular tracking-[0.14em]" : "font-medium tabular",
                  cancelled && row.label === "Data" && "line-through decoration-muted-foreground/60",
                )}
              >
                {row.value}
              </span>
              {row.detail && <span className="text-sm text-muted-foreground tabular">{row.detail}</span>}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
