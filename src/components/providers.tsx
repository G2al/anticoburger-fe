"use client";

import { QueryClientProvider, type QueryClient } from "@tanstack/react-query";
import { LazyMotion, MotionConfig } from "motion/react";
import type { ReactNode } from "react";
import { createQueryClient } from "@/lib/query";

// Le feature di animazione arrivano in un chunk separato: non pesano sul caricamento iniziale.
const loadMotionFeatures = () => import("@/lib/motion-features").then((mod) => mod.default);

let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
  // Un client per ogni render sul server, uno solo condiviso nel browser.
  if (typeof window === "undefined") return createQueryClient();
  browserQueryClient ??= createQueryClient();
  return browserQueryClient;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={getQueryClient()}>
      <LazyMotion features={loadMotionFeatures} strict>
        <MotionConfig reducedMotion="user" transition={{ type: "spring", stiffness: 420, damping: 36, mass: 0.8 }}>
          {children}
        </MotionConfig>
      </LazyMotion>
    </QueryClientProvider>
  );
}
