import { Wordmark } from "@/components/layout/wordmark";

/** Intestazione del menu: logo bordeaux e "MENU" spaziato tra due filetti oro. */
export function MenuHeader() {
  return (
    <header className="flex flex-col items-center text-center">
      <h1 className="flex flex-col items-center gap-2">
        <Wordmark width={260} variant="bordeaux" preload />
        <span className="flex w-full items-center justify-center gap-4">
          <span aria-hidden className="h-px w-14 bg-menu-gold/70" />
          <span className="pl-[0.6em] text-sm font-medium tracking-[0.6em] text-menu-ink">MENU</span>
          <span aria-hidden className="h-px w-14 bg-menu-gold/70" />
        </span>
      </h1>
    </header>
  );
}
