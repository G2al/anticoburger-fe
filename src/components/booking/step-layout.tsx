import type { ReactNode } from "react";
import { BottomActionBar } from "@/components/layout/bottom-action-bar";

/** Struttura comune degli step: intestazione, avvisi, contenuto e barra azioni in basso. */
export function StepLayout({
  header,
  notice,
  children,
  actions,
}: {
  header: ReactNode;
  notice?: ReactNode;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <section className="flex flex-1 flex-col">
      <div className="flex flex-col gap-6 px-safe pb-6 sm:px-6">
        {header}
        <div aria-live="polite" className="empty:hidden">
          {notice}
        </div>
        {children}
      </div>
      {actions ? <BottomActionBar>{actions}</BottomActionBar> : null}
    </section>
  );
}
