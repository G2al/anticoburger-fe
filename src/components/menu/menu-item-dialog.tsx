"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { ArrowRight, X } from "lucide-react";
import { m } from "motion/react";
import Link from "next/link";
import type { RefObject } from "react";
import { menuScript, menuSerif } from "@/app/menu/fonts";
import { buttonVariants } from "@/components/ui/button";
import type { MenuItem } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { MENU_BACKGROUND, type MenuTone } from "./menu-card";
import { MenuDetailImage } from "./menu-image";
import { MenuPrice } from "./menu-price";

export type MenuDetail = { item: MenuItem; tone: MenuTone; category: string };

/** Ingredienti come testo libero separato da virgole → elenco di voci. */
function splitIngredients(text: string): string[] {
  return text
    .split(/[,;]\s*/)
    .map((part) => part.trim())
    .filter(Boolean);
}

const listVariants = { hidden: {}, show: { transition: { staggerChildren: 0.035, delayChildren: 0.12 } } };
const itemVariants = { hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0 } };

/**
 * Dettaglio di un prodotto del menu.
 * Mobile: pannello che sale dal basso (bottom sheet). Desktop: modale centrato.
 * Focus, Esc, tocco sullo sfondo e blocco dello scroll sono gestiti da Base UI;
 * alla chiusura il focus torna alla scheda che l'ha aperto (`returnFocus`).
 */
export function MenuItemDialog({
  detail,
  open,
  onOpenChange,
  returnFocus,
}: {
  detail: MenuDetail | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  returnFocus: RefObject<HTMLElement | null>;
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-menu-ink/45 duration-300 supports-backdrop-filter:backdrop-blur-[3px] data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0 data-closed:duration-200" />
        <DialogPrimitive.Popup
          finalFocus={returnFocus}
          className={cn(
            menuSerif.variable,
            menuScript.variable,
            // Mobile: bottom sheet a tutta larghezza.
            "fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] flex-col overflow-hidden rounded-t-[2rem] bg-menu-page text-menu-ink shadow-[0_-24px_60px_-20px_oklch(0.236_0.08_28.7/0.45)] outline-none",
            "duration-300 ease-out data-open:animate-in data-open:slide-in-from-bottom data-closed:animate-out data-closed:slide-out-to-bottom data-closed:duration-200 data-closed:ease-in",
            // Desktop: modale centrato, ingresso con leggero zoom e risalita.
            "sm:inset-auto sm:top-1/2 sm:left-1/2 sm:max-h-[min(88dvh,52rem)] sm:w-[min(32rem,calc(100%-3rem))] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[2rem]",
            "sm:data-open:fade-in-0 sm:data-open:slide-in-from-bottom-6 sm:data-open:zoom-in-95 sm:data-closed:fade-out-0 sm:data-closed:slide-out-to-bottom-6 sm:data-closed:zoom-out-95",
          )}
        >
          {detail && <DetailBody detail={detail} onNavigate={() => onOpenChange(false)} />}
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function DetailBody({ detail, onNavigate }: { detail: MenuDetail; onNavigate: () => void }) {
  const { item, tone, category } = detail;
  const background = MENU_BACKGROUND[tone];
  const special = tone === "special";
  const ingredients = item.ingredients ? splitIngredients(item.ingredients) : [];

  return (
    <>
      {/* Foto sulla stessa texture della scheda. */}
      <div
        className="relative h-[clamp(15rem,40dvh,21rem)] shrink-0 bg-cover bg-no-repeat"
        style={{ backgroundImage: background.image, backgroundPosition: background.position }}
      >
        <span aria-hidden className="absolute top-2.5 left-1/2 h-1.5 w-11 -translate-x-1/2 rounded-full bg-menu-cream/55 sm:hidden" />
        <m.div
          className="absolute inset-x-6 top-7 bottom-3"
          initial={{ opacity: 0, scale: 0.9, y: 14 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 24, delay: 0.06 }}
        >
          <MenuDetailImage url={item.image_url} name={item.name} dark={tone !== "light"} />
        </m.div>
        <DialogPrimitive.Close
          aria-label="Chiudi"
          className="absolute top-3 right-3 flex size-11 cursor-pointer items-center justify-center rounded-full bg-menu-cream/90 text-menu-ink shadow-md backdrop-blur transition-transform outline-none hover:bg-menu-cream focus-visible:ring-3 focus-visible:ring-menu-gold/60 active:scale-95"
        >
          <X className="size-5" aria-hidden />
        </DialogPrimitive.Close>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain px-6 pt-6 pb-5">
        <p className="text-xs font-semibold tracking-[0.18em] text-menu-gold-ink uppercase">{category}</p>
        {special && (
          <p className="mt-1 font-[family-name:var(--font-menu-script)] text-[2rem] leading-none text-menu-gold-ink">
            Special
          </p>
        )}
        <DialogPrimitive.Title className="mt-1.5 font-[family-name:var(--font-menu-serif)] text-[2.1rem] leading-[1.02] font-bold tracking-tight lining-nums [overflow-wrap:anywhere]">
          {item.name}
        </DialogPrimitive.Title>
        <DialogPrimitive.Description className="sr-only">
          {item.ingredients ? `Ingredienti: ${item.ingredients}` : "Ingredienti non indicati."}
        </DialogPrimitive.Description>

        <MenuPrice price={item.price} className="mt-4 text-[3rem]" />
        <span
          aria-hidden
          className="mt-4 block h-0.5 w-16 rounded-full bg-linear-to-r from-menu-gold via-menu-gold/80 to-menu-gold/0"
        />

        {ingredients.length > 0 && (
          <section aria-label="Ingredienti" className="mt-5 flex flex-col gap-3">
            <h3 className="text-xs font-semibold tracking-[0.18em] text-menu-ink/70 uppercase">Ingredienti</h3>
            <m.ul className="flex flex-wrap gap-2" variants={listVariants} initial="hidden" animate="show">
              {ingredients.map((ingredient, index) => (
                <m.li
                  key={`${ingredient}-${index}`}
                  variants={itemVariants}
                  className="rounded-2xl border border-menu-gold/45 bg-menu-cream px-3.5 py-1.5 text-sm leading-snug text-menu-ink"
                >
                  {ingredient}
                </m.li>
              ))}
            </m.ul>
          </section>
        )}
      </div>

      <div className="shrink-0 border-t border-menu-ink/10 bg-menu-page px-6 pt-4 pb-safe">
        <Link href="/prenota" onClick={onNavigate} className={buttonVariants({ size: "xl" })}>
          Prenota un tavolo
          <ArrowRight aria-hidden data-icon="inline-end" />
        </Link>
      </div>
    </>
  );
}
