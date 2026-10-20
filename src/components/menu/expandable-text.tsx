"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Testo limitato a 3 righe che si espande al tocco.
 * Il pulsante compare solo se il testo è davvero troncato (misurato con ResizeObserver).
 */
export function ExpandableText({ text, className }: { text: string; className?: string }) {
  const [expanded, setExpanded] = useState(false);
  const [truncated, setTruncated] = useState(false);
  const observer = useRef<ResizeObserver | null>(null);

  function measure(node: HTMLParagraphElement | null) {
    observer.current?.disconnect();
    if (!node || typeof ResizeObserver === "undefined") return;
    observer.current = new ResizeObserver(() => setTruncated(node.scrollHeight > node.clientHeight + 1));
    observer.current.observe(node);
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <p ref={measure} className={cn("text-pretty", !expanded && "line-clamp-3", className)}>
        {text}
      </p>
      {(truncated || expanded) && (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
          className="-mx-1 min-h-8 cursor-pointer rounded-md px-1 text-xs font-semibold underline underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-menu-gold"
        >
          {expanded ? "Mostra meno" : "Leggi tutto"}
        </button>
      )}
    </div>
  );
}
