"use client";

import { CloudOff, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { describeError } from "@/lib/api/errors";
import { cn } from "@/lib/utils";

/** Stato d'errore per le letture, con "Riprova". */
export function ErrorState({
  error,
  onRetry,
  retrying = false,
  className,
}: {
  error: unknown;
  onRetry?: () => void;
  retrying?: boolean;
  className?: string;
}) {
  const { message } = describeError(error);
  return (
    <div
      role="alert"
      className={cn("flex flex-col items-center gap-4 rounded-3xl bg-muted/60 px-6 py-8 text-center", className)}
    >
      <CloudOff className="size-7 text-brass" aria-hidden />
      <p className="max-w-xs text-pretty text-foreground">{message}</p>
      {onRetry && (
        <Button variant="outline" size="lg" onClick={onRetry} disabled={retrying}>
          <RotateCw className={cn(retrying && "animate-spin")} aria-hidden data-icon="inline-start" />
          Riprova
        </Button>
      )}
    </div>
  );
}

/** Mostrato quando una lettura è in pausa perché il dispositivo è offline. */
export function OfflineState({ className }: { className?: string }) {
  return (
    <div role="status" className={cn("flex flex-col items-center gap-3 rounded-3xl bg-muted/60 px-6 py-8 text-center", className)}>
      <CloudOff className="size-7 text-brass" aria-hidden />
      <p className="max-w-xs text-pretty">
        Sei offline. I dati verranno caricati automaticamente appena torna la connessione.
      </p>
    </div>
  );
}
