import Image from "next/image";
import { cn } from "@/lib/utils";

// Wordmark ufficiale (ritagliato e reso trasparente da scripts/generate-icons.mjs). Proporzione 1300×450.
const RATIO = 450 / 1300;

export function Wordmark({
  width,
  variant = "dark",
  preload = false,
  className,
}: {
  width: number;
  variant?: "dark" | "light" | "bordeaux";
  /** Precarica l'immagine (al posto di `priority`, deprecato in Next 16). */
  preload?: boolean;
  className?: string;
}) {
  return (
    <Image
      src={`/brand/wordmark-${variant}.png`}
      alt="Antico Burger"
      width={width}
      height={Math.round(width * RATIO)}
      preload={preload}
      sizes={`${width}px`}
      className={cn("h-auto select-none", className)}
      draggable={false}
    />
  );
}
