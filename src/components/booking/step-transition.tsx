"use client";

import { AnimatePresence, m, type Variants } from "motion/react";
import type { ReactNode } from "react";

const variants: Variants = {
  enter: (direction: number) => ({ x: direction * 28, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction * -28, opacity: 0 }),
};

/** Slide + fade direzionale tra gli step (avanti → da destra, indietro → da sinistra). */
export function StepTransition({
  stepKey,
  direction,
  children,
}: {
  stepKey: string;
  direction: 1 | -1;
  children: ReactNode;
}) {
  return (
    <AnimatePresence mode="wait" initial={false} custom={direction}>
      <m.div
        key={stepKey}
        custom={direction}
        variants={variants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{ x: { type: "spring", stiffness: 500, damping: 40 }, opacity: { duration: 0.15 } }}
        className="flex flex-1 flex-col"
      >
        {children}
      </m.div>
    </AnimatePresence>
  );
}
