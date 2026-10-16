import { ExternalLink, MapPin, Navigation } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { restaurant } from "@/config/restaurant";
import { cn } from "@/lib/utils";

/** "Dove ci troviamo": mappa Google incorporata e collegamenti a Google Maps. */
export function RestaurantMap({ className }: { className?: string }) {
  return (
    <section aria-labelledby="map-title" className={cn("flex flex-col gap-3", className)}>
      <h2 id="map-title" className="font-semibold">
        Dove ci troviamo
      </h2>
      <div className="overflow-hidden rounded-3xl bg-card ring-1 ring-border">
        {/* Altezza fissa: nessuno spostamento del layout mentre la mappa si carica. */}
        <iframe
          src={restaurant.maps.embedUrl}
          title={`Mappa: ${restaurant.name}, ${restaurant.address}`}
          className="block h-56 w-full border-0 bg-muted"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
        <p className="flex items-start gap-2 px-4 py-3 text-sm">
          <MapPin className="mt-0.5 size-4 shrink-0 text-brass" aria-hidden />
          <span>
            <span className="font-medium">{restaurant.name}</span>
            <br />
            <span className="text-muted-foreground">{restaurant.address}</span>
          </span>
        </p>
      </div>
      <div className="grid grid-cols-1 gap-2 min-[400px]:grid-cols-2">
        <a
          href={restaurant.maps.directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants({ variant: "outline", size: "lg" })}
        >
          <Navigation aria-hidden data-icon="inline-start" />
          Indicazioni stradali
        </a>
        <a
          href={restaurant.maps.placeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants({ variant: "outline", size: "lg" })}
        >
          <ExternalLink aria-hidden data-icon="inline-start" />
          Apri in Google Maps
        </a>
      </div>
    </section>
  );
}
