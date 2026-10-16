"use client";

import { RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ReloadButton({ label = "Riprova" }: { label?: string }) {
  return (
    <Button size="lg" onClick={() => window.location.reload()}>
      <RotateCw aria-hidden data-icon="inline-start" />
      {label}
    </Button>
  );
}
