import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { buttonVariants } from "@/components/ui/button";
import { Wordmark } from "./wordmark";

/** Intestazione delle pagine interne: indietro · wordmark · azione opzionale. */
export function Header({
  backHref,
  backLabel = "Torna alla home",
  action,
}: {
  backHref?: string;
  backLabel?: string;
  action?: ReactNode;
}) {
  return (
    <header className="grid h-16 shrink-0 grid-cols-[3rem_1fr_3rem] items-center px-safe sm:px-6">
      <div>
        {backHref ? (
          <Link
            href={backHref}
            aria-label={backLabel}
            className={buttonVariants({ variant: "ghost", size: "icon-lg", className: "-ml-2" })}
          >
            <ChevronLeft className="size-5" aria-hidden />
          </Link>
        ) : null}
      </div>
      <Link href="/" className="justify-self-center rounded-lg focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none">
        <Wordmark width={112} />
      </Link>
      <div className="justify-self-end">{action}</div>
    </header>
  );
}
