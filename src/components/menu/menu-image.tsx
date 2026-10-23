"use client";

import { UtensilsCrossed } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Next 16 rifiuta di ottimizzare immagini da IP locali (images.dangerouslyAllowLocalIP, rischio SSRF):
 * in sviluppo le foto del backend locale arrivano direttamente al browser, senza ottimizzazione.
 */
function isLocalImage(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return hostname === "localhost" || hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

/**
 * Foto del prodotto (PNG/WebP scontornato caricato da Filament). Se manca o non si carica
 * (file rimosso, errore di rete) compare un segnaposto in tinta. Occupa sempre lo stesso box del genitore.
 */
export function MenuImage({
  url,
  name,
  dark,
  sizes = "(min-width: 480px) 230px, 48vw",
}: {
  url: string | null;
  name: string;
  dark: boolean;
  /** Larghezza mostrata, per scegliere la versione ottimizzata giusta. */
  sizes?: string;
}) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  if (!url || failedUrl === url) return <MenuImagePlaceholder name={name} dark={dark} />;

  return (
    <Image
      src={url}
      alt={name}
      fill
      sizes={sizes}
      unoptimized={isLocalImage(url)}
      onError={() => setFailedUrl(url)}
      className="object-contain object-[50%_45%] drop-shadow-[0_14px_16px_oklch(0.2_0.05_30/0.4)] select-none"
      draggable={false}
    />
  );
}

function MenuImagePlaceholder({ name, dark }: { name: string; dark: boolean }) {
  return (
    <div className="flex size-full items-center justify-center" role="img" aria-label={name}>
      <span
        className={cn(
          "flex aspect-square w-[72%] items-center justify-center rounded-full border",
          dark ? "border-menu-gold/40 bg-menu-cream/8" : "border-menu-gold/50 bg-menu-ink/5",
        )}
      >
        <UtensilsCrossed className={cn("size-[28%]", dark ? "text-menu-gold/80" : "text-menu-gold")} aria-hidden />
      </span>
    </div>
  );
}
