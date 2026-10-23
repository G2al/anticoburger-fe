"use client";

import { UtensilsCrossed } from "lucide-react";
import { useRef, useState, type MouseEvent } from "react";
import { ErrorState, OfflineState } from "@/components/common/error-state";
import { useHydrated } from "@/hooks/use-hydrated";
import { useMenu } from "@/hooks/use-menu";
import type { MenuCategory, MenuItem } from "@/lib/api/types";
import { MenuCard, MenuCardSkeleton, type MenuTone } from "./menu-card";
import { categorySectionId, MenuCategoryNav, SPECIAL_CATEGORY_ID } from "./menu-category-nav";
import { MenuItemDialog, type MenuDetail } from "./menu-item-dialog";

/** Apre il dettaglio di un prodotto (chiamato dal tocco sulla scheda). */
type OpenDetail = (detail: MenuDetail, event: MouseEvent<HTMLButtonElement>) => void;

/** Il menu si legge solo nel browser (dato del backend, mai prerenderizzato). */
export function MenuView() {
  const hydrated = useHydrated();
  return hydrated ? <MenuContent /> : <MenuSkeleton />;
}

function MenuContent() {
  const menu = useMenu();
  const categories = menu.data;
  // Un solo dialog per la pagina. Il dettaglio resta impostato anche durante l'animazione di chiusura.
  const [detail, setDetail] = useState<MenuDetail | null>(null);
  const [open, setOpen] = useState(false);
  const opener = useRef<HTMLElement | null>(null);

  const openDetail: OpenDetail = (next, event) => {
    opener.current = event.currentTarget;
    setDetail(next);
    setOpen(true);
  };

  if (!categories) {
    if (menu.isError) {
      return <ErrorState error={menu.error} onRetry={() => menu.refetch()} retrying={menu.isFetching} />;
    }
    if (menu.fetchStatus === "paused") return <OfflineState />;
    return <MenuSkeleton />;
  }

  if (categories.length === 0) {
    return (
      <div role="status" className="flex flex-col items-center gap-3 rounded-3xl bg-menu-beige/60 px-6 py-10 text-center">
        <UtensilsCrossed className="size-7 text-menu-gold" aria-hidden />
        <p className="text-menu-ink">Il menu sarà disponibile a breve.</p>
      </div>
    );
  }

  // Sezione "Special" ricavata dai dati: gli is_special di tutte le categorie, nell'ordine ricevuto.
  const specials = categories.flatMap((category) => category.items.filter((item) => item.is_special));
  const special: MenuCategory | null = specials.length
    ? { id: SPECIAL_CATEGORY_ID, name: "Special", items: specials }
    : null;
  const navCategories = special ? [special, ...categories] : categories;
  // Categoria reale di ogni prodotto: nel dettaglio di uno Special si mostra "Panini", non "Special".
  const categoryOf = new Map(categories.flatMap((category) => category.items.map((item) => [item.id, category.name])));

  return (
    <div className="flex flex-col gap-6">
      {navCategories.length > 1 && <MenuCategoryNav categories={navCategories} />}
      <div className="flex flex-col gap-14">
        {special && <SpecialSection category={special} categoryOf={categoryOf} onOpen={openDetail} />}
        {categories.map((category) => (
          <CategorySection key={category.id} category={category} onOpen={openDetail} />
        ))}
      </div>
      <MenuItemDialog detail={detail} open={open} onOpenChange={setOpen} returnFocus={opener} />
    </div>
  );
}

function SpecialSection({
  category,
  categoryOf,
  onOpen,
}: {
  category: MenuCategory;
  categoryOf: Map<number, string>;
  onOpen: OpenDetail;
}) {
  const headingId = `${categorySectionId(category)}-titolo`;
  return (
    <section
      id={categorySectionId(category)}
      data-category-id={category.id}
      aria-labelledby={headingId}
      className="flex scroll-mt-20 flex-col gap-12"
    >
      <h2 id={headingId} className="flex items-center gap-4 text-menu-gold-ink">
        <span aria-hidden className="h-px flex-1 bg-menu-gold/60" />
        <span className="font-[family-name:var(--font-menu-script)] text-[2.6rem] leading-none">Special</span>
        <span aria-hidden className="h-px flex-1 bg-menu-gold/60" />
      </h2>
      {category.items.map((item) => (
        <MenuCard
          key={item.id}
          item={item}
          tone="special"
          idPrefix="special"
          onOpen={(event) => onOpen({ item, tone: "special", category: categoryOf.get(item.id) ?? "Special" }, event)}
        />
      ))}
    </section>
  );
}

function CategorySection({ category, onOpen }: { category: MenuCategory; onOpen: OpenDetail }) {
  const headingId = `${categorySectionId(category)}-titolo`;
  return (
    <section
      id={categorySectionId(category)}
      data-category-id={category.id}
      aria-labelledby={headingId}
      className="flex scroll-mt-20 flex-col gap-12"
    >
      <h2 id={headingId} className="flex items-center gap-4 text-menu-ink">
        <span aria-hidden className="h-px flex-1 bg-menu-gold/60" />
        <span className="font-[family-name:var(--font-menu-serif)] text-2xl font-bold tracking-tight">
          {category.name}
        </span>
        <span aria-hidden className="h-px flex-1 bg-menu-gold/60" />
      </h2>
      {/* Ordine ricevuto. Special con la propria scheda; gli altri alternati marrone/beige, da marrone in ogni categoria. */}
      {withTones(category.items).map(({ item, tone }) => (
        <MenuCard
          key={item.id}
          item={item}
          tone={tone}
          onOpen={(event) => onOpen({ item, tone, category: category.name }, event)}
        />
      ))}
    </section>
  );
}

/** L'alternanza marrone/beige conta solo i prodotti non Special, così resta regolare. */
function withTones(items: MenuItem[]): { item: MenuItem; tone: MenuTone }[] {
  let regular = 0;
  return items.map((item) => {
    if (item.is_special) return { item, tone: "special" };
    const tone = regular % 2 === 0 ? "dark" : "light";
    regular += 1;
    return { item, tone };
  });
}

/** Stesse dimensioni dei contenuti finali: nessuno spostamento quando arriva il menu. */
export function MenuSkeleton() {
  return (
    <div aria-busy="true" aria-label="Caricamento del menu" className="flex flex-col gap-12">
      <div className="flex gap-2" aria-hidden>
        {[96, 80, 112].map((width) => (
          <span key={width} className="h-11 animate-pulse rounded-full bg-menu-beige" style={{ width }} />
        ))}
      </div>
      <MenuCardSkeleton tone="dark" />
      <MenuCardSkeleton tone="light" />
    </div>
  );
}
