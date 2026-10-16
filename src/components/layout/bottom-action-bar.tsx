import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Barra azioni fissata in basso, raggiungibile con il pollice e rispettosa dell'home indicator. */
export function BottomActionBar({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "sticky bottom-0 z-20 mt-auto px-safe pt-4 pb-safe sm:px-6",
        "bg-linear-to-t from-background from-70% to-transparent sm:from-card",
        className,
      )}
    >
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}
