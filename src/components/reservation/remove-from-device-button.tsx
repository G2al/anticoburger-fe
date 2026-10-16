"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { removeStoredReservation } from "@/lib/reservation-storage";

/**
 * Toglie la prenotazione dall'elenco di questo dispositivo, dopo conferma.
 * Non tocca il server: chiarirlo nel testo è essenziale per non confondere rimozione e annullamento.
 */
export function RemoveFromDeviceButton({
  reference,
  description,
  onRemoved,
}: {
  reference: string;
  description: string;
  onRemoved: () => void;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant="ghost" size="lg" />}>Rimuovi da questo dispositivo</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Rimuovere da questo dispositivo?</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel size="lg">Mantieni</AlertDialogCancel>
          <AlertDialogAction
            size="lg"
            onClick={() => {
              removeStoredReservation(reference);
              onRemoved();
            }}
          >
            Rimuovi
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
