import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Contenitore delle pagine: colonna singola su mobile, "card" centrata su schermi larghi.
 * Le safe area di notch e home indicator sono gestite qui e in BottomActionBar.
 */
export function AppShell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className="flex min-h-dvh w-full justify-center sm:px-6 sm:py-10">
      <div
        className={cn(
          // overflow-x-clip: le transizioni orizzontali tra step non generano mai scroll laterale.
          "relative flex w-full max-w-[30rem] flex-col overflow-x-clip pt-safe",
          "sm:min-h-[min(52rem,calc(100dvh-5rem))] sm:rounded-4xl sm:bg-card sm:shadow-[0_24px_60px_-28px_oklch(0.241_0.043_29.8/0.35)] sm:ring-1 sm:ring-foreground/5",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}
