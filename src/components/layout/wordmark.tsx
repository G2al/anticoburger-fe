import Image from "next/image";
import { cn } from "@/lib/utils";

// Wordmark ufficiale (ritagliato e reso trasparente da scripts/generate-icons.mjs). Proporzione 1300×450.
const RATIO = 450 / 1300;

export function Wordmark({
  width,
  variant = "dark",
  priority = false,
  className,
}: {
  width: number;
  variant?: "dark" | "light";
  priority?: boolean;
  className?: string;
}) {
  return (
    <Image
      src={variant === "dark" ? "/brand/wordmark-dark.png" : "/brand/wordmark-light.png"}
      alt="Antico Burger"
      width={width}
      height={Math.round(width * RATIO)}
      priority={priority}
      sizes={`${width}px`}
      className={cn("h-auto select-none", className)}
      draggable={false}
    />
  );
}
