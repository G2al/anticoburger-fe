import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { BottomActionBar } from "@/components/layout/bottom-action-bar";
import { Header } from "@/components/layout/header";
import { MenuHeader } from "@/components/menu/menu-header";
import { MenuView } from "@/components/menu/menu-view";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { menuSerif } from "./fonts";

export const metadata: Metadata = {
  title: { absolute: "Menu – Antico Burger" },
  description: "Il menu di Antico Burger: panini, ingredienti e prezzi.",
};

export default function MenuPage() {
  return (
    <AppShell className={cn(menuSerif.variable, "bg-menu-page sm:bg-menu-page")}>
      <Header backHref="/" showWordmark={false} />
      <main className="flex flex-1 flex-col">
        <div className="flex flex-col gap-10 px-safe pt-2 pb-8 sm:px-6">
          <MenuHeader />
          {/* Dati dal backend (GET /menu), caricati solo nel browser. */}
          <MenuView />
        </div>

        <BottomActionBar className="from-menu-page sm:from-menu-page">
          <Link href="/prenota" className={buttonVariants({ size: "xl" })}>
            Prenota un tavolo
            <ArrowRight aria-hidden data-icon="inline-end" />
          </Link>
        </BottomActionBar>
      </main>
    </AppShell>
  );
}
