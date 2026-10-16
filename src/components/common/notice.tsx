"use client";

import { AlertCircle, Info } from "lucide-react";
import { m } from "motion/react";
import type { ReactNode } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export type NoticeTone = "info" | "error";

/** Avviso animato annunciato dagli screen reader (role="alert"). */
export function Notice({
  tone = "info",
  title,
  children,
}: {
  tone?: NoticeTone;
  title?: string;
  children: ReactNode;
}) {
  const Icon = tone === "error" ? AlertCircle : Info;
  return (
    <m.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
      <Alert variant={tone === "error" ? "destructive" : "info"}>
        <Icon aria-hidden />
        {title && <AlertTitle>{title}</AlertTitle>}
        <AlertDescription className={tone === "error" ? undefined : "text-accent-foreground"}>{children}</AlertDescription>
      </Alert>
    </m.div>
  );
}
