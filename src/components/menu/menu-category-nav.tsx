"use client";

import { Sparkles } from "lucide-react";
import { useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { MenuCategory } from "@/lib/api/types";
import { cn } from "@/lib/utils";

/** Id della sezione "Special" (derivata dai dati): gli id del backend partono da 1. */
export const SPECIAL_CATEGORY_ID = 0;

export function categorySectionId(category: Pick<MenuCategory, "id">) {
  return `categoria-${category.id}`;
}

/**
 * Chip delle categorie, fissi in alto: il tocco porta alla sezione, la categoria visibile è evidenziata.
 */
export function MenuCategoryNav({ categories }: { categories: MenuCategory[] }) {
  const [active, setActive] = useState(categories[0]?.id);
  const reduceMotion = useReducedMotion();
  const chips = useRef(new Map<number, HTMLButtonElement>());

  // Categoria visibile: quella la cui sezione attraversa la fascia alta dello schermo.
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((entry) => entry.isIntersecting);
        if (!visible) return;
        const id = Number(visible.target.getAttribute("data-category-id"));
        setActive(id);
        chips.current.get(id)?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
      },
      { rootMargin: "-30% 0px -60% 0px" },
    );
    for (const category of categories) {
      const section = document.getElementById(categorySectionId(category));
      if (section) observer.observe(section);
    }
    return () => observer.disconnect();
  }, [categories]);

  function goTo(category: MenuCategory) {
    setActive(category.id);
    document
      .getElementById(categorySectionId(category))
      ?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  }

  return (
    <nav
      aria-label="Categorie del menu"
      className="sticky top-(--safe-top) z-30 -mx-5 bg-menu-page/95 px-5 py-3 backdrop-blur supports-backdrop-filter:bg-menu-page/80 sm:-mx-6 sm:px-6"
    >
      <ul className="flex snap-x gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {categories.map((category) => {
          const selected = category.id === active;
          const special = category.id === SPECIAL_CATEGORY_ID;
          return (
            <li key={category.id} className="snap-start">
              <button
                ref={(node) => {
                  if (node) chips.current.set(category.id, node);
                  else chips.current.delete(category.id);
                }}
                type="button"
                onClick={() => goTo(category)}
                aria-current={selected ? "true" : undefined}
                className={cn(
                  "inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-full border px-4 text-sm font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-3 focus-visible:ring-menu-gold/50",
                  selected
                    ? "border-menu-brown bg-menu-brown text-menu-cream"
                    : "border-menu-ink/15 bg-menu-cream text-menu-ink hover:border-menu-ink/35",
                  special && "border-menu-gold",
                )}
              >
                {special && <Sparkles className={cn("size-3.5", selected ? "text-menu-gold" : "text-menu-gold-ink")} aria-hidden />}
                {category.name}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
