"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

interface reveal_props {
  children: ReactNode;
  /** seconds of delay for stagger */
  delay?: number;
  /** vertical offset in px */
  y?: number;
  className?: string;
}

/**
 * Reveal — entrance animation for section content. Fades+lifts once when
 * entering the viewport. Under reduced motion: opacity only, near-instant.
 * Without JS (or before hydration) content is fully visible.
 */
export function Reveal({ children, delay = 0, y = 24, className }: reveal_props) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduced ? { opacity: 0 } : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-12% 0px" }}
      transition={{
        duration: reduced ? 0.15 : 0.7,
        delay: reduced ? 0 : delay,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      {children}
    </motion.div>
  );
}
