"use client";

import { ChevronRight, Sparkles } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { activePromo } from "@/config/promo";
import { useHydrated } from "@/hooks/use-hydrated";
import { cn } from "@/lib/utils";

/**
 * Banner discreto della promozione attiva: una riga compatta, la locandina si apre solo al tocco.
 * Mostrato solo nel browser (la scadenza dipende dall'ora attuale) e mai dopo `endsAt`.
 */
export function PromoBanner({ className }: { className?: string }) {
  const hydrated = useHydrated();
  // L'ora attuale si legge solo nel browser: nel prerender il componente interno non viene mai eseguito.
  return hydrated ? <PromoBannerContent className={className} /> : null;
}

function PromoBannerContent({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  // Valutato una sola volta all'apertura della pagina.
  const [promo] = useState(() =>
    activePromo && Date.now() < new Date(activePromo.endsAt).getTime() ? activePromo : null,
  );

  if (!promo) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "group flex w-full cursor-pointer items-center gap-3 rounded-3xl bg-linear-to-br from-[#5a1219] to-[#3a0a0f] p-2.5 pr-4 text-left text-[#f5e6c8] shadow-sm ring-1 ring-[#c9a25a]/40 transition-shadow outline-none hover:shadow-md focus-visible:ring-3 focus-visible:ring-[#c9a25a]/60",
          className,
        )}
      >
        <span className="relative size-14 shrink-0 overflow-hidden rounded-2xl ring-1 ring-[#c9a25a]/40">
          <Image
            src={promo.image.src}
            alt=""
            fill
            sizes="56px"
            className="object-cover object-[50%_18%]"
          />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="flex items-center gap-1.5 text-[0.7rem] font-semibold tracking-wider text-[#d9b46a] uppercase">
            <Sparkles className="size-3" aria-hidden />
            Promo
          </span>
          <span className="truncate font-semibold">{promo.title}</span>
          <span className="line-clamp-2 text-xs text-[#f5e6c8]/75">{promo.summary}</span>
        </span>
        <ChevronRight
          className="size-5 shrink-0 text-[#d9b46a] transition-transform group-hover:translate-x-0.5"
          aria-hidden
        />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] w-auto gap-0 overflow-hidden bg-[#3a0a0f] p-0 sm:max-w-sm">
          <DialogTitle className="sr-only">{promo.title}</DialogTitle>
          <DialogDescription className="sr-only">{promo.summary}</DialogDescription>
          <Image
            src={promo.image.src}
            alt={promo.image.alt}
            width={promo.image.width}
            height={promo.image.height}
            sizes="(min-width: 640px) 384px, 100vw"
            className="h-auto max-h-[calc(100dvh-2rem)] w-full object-contain"
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
