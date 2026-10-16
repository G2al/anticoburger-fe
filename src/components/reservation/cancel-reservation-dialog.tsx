"use client";

import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Notice } from "@/components/common/notice";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useCancelReservation } from "@/hooks/use-cancel-reservation";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { describeError } from "@/lib/api/errors";
import type { Reservation } from "@/lib/api/types";
import { formatLongDate, pluralizePeople } from "@/lib/date";

/** Caricato con import dinamico: serve solo quando l'utente vuole annullare. */
export default function CancelReservationDialog({
  reservation,
  token,
  open,
  onOpenChange,
  onCancelled,
}: {
  reservation: Reservation;
  token: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCancelled: (alreadyCancelled: boolean) => void;
}) {
  const online = useOnlineStatus();
  const mutation = useCancelReservation(reservation.reference, token);
  const wasCancelled = reservation.status === "cancelled";

  function confirm() {
    if (mutation.isPending) return;
    mutation.mutate(undefined, {
      onSuccess: () => {
        onOpenChange(false);
        toast.success(wasCancelled ? "La prenotazione risulta già annullata" : "Prenotazione annullata");
        onCancelled(wasCancelled);
      },
    });
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!mutation.isPending) onOpenChange(next);
        if (!next) mutation.reset();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Annullare la prenotazione?</AlertDialogTitle>
          <AlertDialogDescription>
            {formatLongDate(reservation.date)} alle {reservation.time}, {pluralizePeople(reservation.party_size)}.
            L&apos;annullamento è definitivo e il tavolo tornerà disponibile.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {mutation.isError && (
          <Notice tone="error">{describeError(mutation.error).message}</Notice>
        )}
        {!online && <p className="text-sm text-muted-foreground">Sei offline: potrai annullare appena torna la connessione.</p>}
        <AlertDialogFooter>
          <AlertDialogCancel size="lg" disabled={mutation.isPending}>
            Mantieni
          </AlertDialogCancel>
          <Button
            variant="destructive"
            size="lg"
            onClick={confirm}
            disabled={mutation.isPending || !online}
            aria-busy={mutation.isPending}
          >
            {mutation.isPending && <Loader2 className="animate-spin" aria-hidden data-icon="inline-start" />}
            {mutation.isPending ? "Annullamento…" : "Sì, annulla"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
