import type { MenuItem } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { ExpandableText } from "./expandable-text";
import { MenuImage } from "./menu-image";
import { MenuPrice } from "./menu-price";

export type MenuTone = "dark" | "light";

/** Sfondi della grafica ufficiale (public/menu, generati da `npm run menu-images`). */
const BACKGROUND: Record<MenuTone, { image: string; position: string }> = {
  // Pennellata grunge nella metà destra, dietro il panino.
  dark: { image: "url(/menu/bg-dark.webp)", position: "75% center" },
  // Pennellata al centro: cade tra il panino (a sinistra) e il testo.
  light: { image: "url(/menu/bg-light.webp)", position: "50% center" },
};

/**
 * Scheda di un prodotto nello stile della grafica del menu.
 * Marrone: testi crema e foto a destra. Beige: testi marroni e foto a sinistra.
 * La foto resta dentro la scheda (sporge appena in alto) e non copre mai il testo.
 */
export function MenuCard({ item, tone }: { item: MenuItem; tone: MenuTone }) {
  const dark = tone === "dark";
  const background = BACKGROUND[tone];
  const titleId = `menu-item-${item.id}`;

  return (
    <article
      aria-labelledby={titleId}
      style={{ backgroundImage: background.image, backgroundPosition: background.position }}
      className={cn(
        "@container relative isolate rounded-[1.75rem] bg-cover bg-no-repeat shadow-[0_18px_36px_-22px_oklch(0.236_0.08_28.7/0.55)]",
        dark ? "bg-menu-brown text-menu-cream" : "bg-menu-beige text-menu-ink",
      )}
    >
      <div
        className={cn(
          "flex min-h-[15rem] flex-col justify-center gap-2.5 py-7",
          dark ? "pr-[50%] pl-5" : "pr-5 pl-[52%]",
        )}
      >
        <h3
          id={titleId}
          className="font-[family-name:var(--font-menu-serif)] text-[clamp(1.6rem,8.4cqw,2.7rem)] leading-[0.98] font-bold tracking-tight lining-nums [overflow-wrap:anywhere]"
        >
          {item.name}
        </h3>
        {item.ingredients && (
          <ExpandableText
            text={item.ingredients}
            className={cn(
              "text-[clamp(0.78rem,3.5cqw,0.95rem)] leading-snug",
              dark ? "text-menu-cream/90" : "text-menu-ink/85",
            )}
          />
        )}
        <span
          aria-hidden
          className="mt-1 h-0.5 w-16 rounded-full bg-linear-to-r from-menu-gold via-menu-gold/80 to-menu-gold/0"
        />
        <MenuPrice price={item.price} className="text-[clamp(2.4rem,13cqw,4.2rem)]" />
      </div>

      {/* Colonna della foto (47%): alta quanto la scheda, sporge del 6% in alto. */}
      <div
        className={cn(
          "pointer-events-none absolute -top-[6%] bottom-[1%] w-[47%]",
          dark ? "right-[1.5%]" : "left-[1.5%]",
        )}
      >
        <MenuImage url={item.image_url} name={item.name} dark={dark} />
      </div>
    </article>
  );
}

export function MenuCardSkeleton({ tone }: { tone: MenuTone }) {
  const dark = tone === "dark";
  return (
    <div
      aria-hidden
      className={cn("relative min-h-[15rem] animate-pulse rounded-[1.75rem]", dark ? "bg-menu-brown/80" : "bg-menu-beige/80")}
    >
      <div className={cn("flex flex-col gap-3 py-7", dark ? "pr-[50%] pl-5" : "pr-5 pl-[52%]")}>
        <span className={cn("h-8 w-3/4 rounded-lg", dark ? "bg-menu-cream/15" : "bg-menu-ink/10")} />
        <span className={cn("h-3 w-full rounded", dark ? "bg-menu-cream/10" : "bg-menu-ink/8")} />
        <span className={cn("h-3 w-5/6 rounded", dark ? "bg-menu-cream/10" : "bg-menu-ink/8")} />
        <span className={cn("mt-4 h-10 w-1/2 rounded-lg", dark ? "bg-menu-cream/15" : "bg-menu-ink/10")} />
      </div>
    </div>
  );
}
