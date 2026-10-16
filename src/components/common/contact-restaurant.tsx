import { MapPin, Phone } from "lucide-react";
import { restaurant } from "@/config/restaurant";
import { cn } from "@/lib/utils";

/** Contatti statici del ristorante (src/config/restaurant.ts). */
export function ContactRestaurant({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <div className={cn("flex flex-col gap-1 text-sm", className)}>
      <a
        href={restaurant.phoneHref}
        className="inline-flex min-h-11 items-center gap-2 self-start rounded-lg font-medium text-foreground underline-offset-4 hover:underline focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none"
      >
        <Phone className="size-4 text-brass" aria-hidden />
        <span className="tabular">{restaurant.phoneDisplay}</span>
      </a>
      {!compact && (
        <p className="inline-flex items-center gap-2 text-muted-foreground">
          <MapPin className="size-4 text-brass" aria-hidden />
          {restaurant.address}
        </p>
      )}
    </div>
  );
}
