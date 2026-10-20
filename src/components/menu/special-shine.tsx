"use client";

import { m, useReducedMotion } from "motion/react";

/**
 * Riflesso di luce che attraversa la scheda Special una sola volta, quando entra nello schermo.
 * Con "riduci movimento" il riflesso decorativo viene omesso del tutto.
 */
export function SpecialShine() {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) return null;

  return (
    <span aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
      <m.span
        className="absolute inset-y-0 left-0 w-1/3 -skew-x-12 bg-linear-to-r from-transparent via-menu-gold/25 to-transparent"
        initial={{ x: "-120%", opacity: 0 }}
        whileInView={{ x: "380%", opacity: [0, 1, 1, 0] }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 1.4, ease: "easeInOut", delay: 0.2 }}
      />
    </span>
  );
}
