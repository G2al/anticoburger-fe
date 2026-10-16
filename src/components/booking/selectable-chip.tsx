"use client";

import { m } from "motion/react";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/**
 * Chip selezionabile (persone, orari). L'indicatore di selezione è condiviso tramite `layoutId`
 * e scorre da una chip all'altra.
 */
export function SelectableChip({
  selected,
  indicatorId,
  className,
  children,
  ...props
}: Omit<ComponentProps<"button">, "ref"> & { selected: boolean; indicatorId: string }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        "relative isolate flex min-h-12 items-center justify-center rounded-2xl border text-base font-medium tabular transition-[color,border-color,transform] duration-150",
        "cursor-pointer outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/40 active:scale-[0.96] motion-reduce:active:scale-100",
        selected
          ? "border-primary text-primary-foreground"
          : "border-border bg-card text-foreground hover:border-foreground/30",
        className,
      )}
      {...props}
    >
      {selected && (
        <m.span
          layoutId={indicatorId}
          className="absolute inset-0 -z-10 rounded-[inherit] bg-primary"
          transition={{ type: "spring", stiffness: 520, damping: 38 }}
          aria-hidden
        />
      )}
      {children}
    </button>
  );
}
