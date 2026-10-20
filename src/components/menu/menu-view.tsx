"use client";

import { UtensilsCrossed } from "lucide-react";
import { ErrorState, OfflineState } from "@/components/common/error-state";
import { useHydrated } from "@/hooks/use-hydrated";
import { useMenu } from "@/hooks/use-menu";
import type { MenuCategory } from "@/lib/api/types";
import { MenuCard, MenuCardSkeleton } from "./menu-card";
import { categorySectionId, MenuCategoryNav } from "./menu-category-nav";

/** Il menu si legge solo nel browser (dato del backend, mai prerenderizzato). */
export function MenuView() {
  const hydrated = useHydrated();
  return hydrated ? <MenuContent /> : <MenuSkeleton />;
}

function MenuContent() {
  const menu = useMenu();
  const categories = menu.data;

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

  return (
    <div className="flex flex-col gap-6">
      {categories.length > 1 && <MenuCategoryNav categories={categories} />}
      <div className="flex flex-col gap-14">
        {categories.map((category) => (
          <CategorySection key={category.id} category={category} />
        ))}
      </div>
    </div>
  );
}

function CategorySection({ category }: { category: MenuCategory }) {
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
      {/* Ordine dei prodotti quello ricevuto; schede alternate marrone/beige, da marrone in ogni categoria. */}
      {category.items.map((item, index) => (
        <MenuCard key={item.id} item={item} tone={index % 2 === 0 ? "dark" : "light"} />
      ))}
    </section>
  );
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
