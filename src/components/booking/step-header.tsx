"use client";

import { ChevronLeft } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { STEPS } from "./booking-draft";

/**
 * Titolo dello step con indicatore di avanzamento.
 * Al cambio step il focus va sul titolo, così gli screen reader annunciano la nuova schermata.
 */
export function StepHeader({
  index,
  title,
  description,
  onBack,
  focusOnMount,
}: {
  index: number;
  title: string;
  description?: ReactNode;
  onBack?: () => void;
  focusOnMount: boolean;
}) {
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (focusOnMount) titleRef.current?.focus({ preventScroll: true });
  }, [focusOnMount]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex h-11 items-center gap-3">
        {onBack ? (
          <Button variant="ghost" size="icon-lg" className="-ml-3" onClick={onBack} aria-label="Indietro">
            <ChevronLeft className="size-5" aria-hidden />
          </Button>
        ) : null}
        <div className="flex flex-1 items-center gap-1.5" aria-hidden>
          {STEPS.map((step, i) => (
            <span
              key={step}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors duration-300",
                i <= index ? "bg-primary" : "bg-border",
              )}
            />
          ))}
        </div>
        <span className="text-xs font-medium text-muted-foreground tabular">
          <span className="sr-only">Passo </span>
          {index + 1} di {STEPS.length}
        </span>
      </div>
      <div className="flex flex-col gap-1.5">
        <h1 ref={titleRef} tabIndex={-1} className="text-[1.75rem] leading-tight font-semibold outline-none">
          {title}
        </h1>
        {description ? <p className="text-pretty text-muted-foreground">{description}</p> : null}
      </div>
    </div>
  );
}
