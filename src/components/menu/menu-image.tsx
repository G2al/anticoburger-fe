"use client";

import { UtensilsCrossed } from "lucide-react";
import Image, { getImageProps } from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

/** Larghezza della foto nella scheda (circa metà scheda). */
export const CARD_IMAGE_SIZES = "(min-width: 480px) 230px, 48vw";
/**
 * Larghezza della foto nel dettaglio. Volutamente un po' sotto la misura reale:
 * su iPhone porta a ~828 px (~150 KB) invece di 1080 px (~235 KB), con una differenza di nitidezza impercettibile.
 */
export const DETAIL_IMAGE_SIZES = "(min-width: 640px) 400px, 70vw";

const IMAGE_CLASS = "object-contain object-[50%_45%] select-none";

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
 * Foto del prodotto nella scheda (PNG/WebP scontornato caricato da Filament). Se manca o non si carica
 * (file rimosso, errore di rete) compare un segnaposto in tinta. Occupa sempre lo stesso box del genitore.
 */
export function MenuImage({ url, name, dark }: { url: string | null; name: string; dark: boolean }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  if (!url || failedUrl === url) return <MenuImagePlaceholder name={name} dark={dark} />;

  return (
    <Image
      src={url}
      alt={name}
      fill
      sizes={CARD_IMAGE_SIZES}
      unoptimized={isLocalImage(url)}
      onError={() => setFailedUrl(url)}
      className={cn(IMAGE_CLASS, "drop-shadow-[0_14px_16px_oklch(0.2_0.05_30/0.4)]")}
      draggable={false}
    />
  );
}

/**
 * Foto del dettaglio, progressiva:
 * 1. subito la versione della scheda (stessi `sizes` → stesso file, già nella cache del browser);
 * 2. sopra, la versione più definita, che compare in dissolvenza appena è pronta.
 * L'ombra sta sul contenitore, così le due immagini sovrapposte non la raddoppiano.
 */
export function MenuDetailImage({ url, name, dark }: { url: string | null; name: string; dark: boolean }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const [sharpUrl, setSharpUrl] = useState<string | null>(null);

  if (!url || failedUrl === url) return <MenuImagePlaceholder name={name} dark={dark} />;

  const unoptimized = isLocalImage(url);
  const sharpReady = sharpUrl === url;

  return (
    <div className="relative size-full drop-shadow-[0_18px_20px_oklch(0.2_0.05_30/0.4)]">
      <Image
        src={url}
        alt=""
        aria-hidden
        fill
        sizes={CARD_IMAGE_SIZES}
        unoptimized={unoptimized}
        onError={() => setFailedUrl(url)}
        className={cn(IMAGE_CLASS, "transition-opacity duration-300", sharpReady && "opacity-0")}
        draggable={false}
      />
      <Image
        src={url}
        alt={name}
        fill
        sizes={DETAIL_IMAGE_SIZES}
        unoptimized={unoptimized}
        onLoad={() => setSharpUrl(url)}
        className={cn(IMAGE_CLASS, "transition-opacity duration-300 ease-out", sharpReady ? "opacity-100" : "opacity-0")}
        draggable={false}
      />
    </div>
  );
}

const preloaded = new Set<string>();

/**
 * Avvia il download della foto del dettaglio prima che il modale si apra (al tocco o al passaggio del mouse).
 * Usa `getImageProps` con gli stessi parametri di MenuDetailImage: il browser sceglie lo stesso file e lo mette in cache.
 */
export function preloadDetailImage(url: string | null) {
  if (!url || preloaded.has(url) || typeof window === "undefined") return;
  preloaded.add(url);
  const { props } = getImageProps({
    src: url,
    alt: "",
    fill: true,
    sizes: DETAIL_IMAGE_SIZES,
    unoptimized: isLocalImage(url),
  });
  const image = new window.Image();
  if (props.sizes) image.sizes = props.sizes;
  if (props.srcSet) image.srcset = props.srcSet;
  image.src = props.src;
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
