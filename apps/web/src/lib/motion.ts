/** ============================================================================
 * BRICK — unified motion design spec (Section 4)
 *
 * One canonical timing/easing scale. Every Motion/GSAP call sitewide pulls
 * from here — no more one-off hand-picked durations per component.
 *
 * Two families, never mixed:
 *   • Springs — for direct user interaction (hover, press, drag). Physical,
 *     responsive, snappy back to rest.
 *   • Timing curves — for scroll- and entrance-driven motion. Directed,
 *     intentional, never bouncy.
 * ============================================================================ */

export type MotionKey =
  | "micro"
  | "small"
  | "reveal"
  | "hero"
  | "impact";

/** Time-based tokens (ms) for scroll/entrance motion. */
export const MOTION_MS: Record<MotionKey, number> = {
  micro: 150,     // hover/press feedback
  small: 260,     // dropdowns, tooltips, small reveals
  reveal: 520,    // section reveal fade/slide-up
  hero: 750,      // hero entrance, slightly grander
  impact: 190,    // brick impact burst (shake/squash)
} as const;

/** Easing curves for time-based motion. */
export const MOTION_EASE: Record<MotionKey, string> = {
  micro: "cubic-bezier(0.4, 0, 0.2, 1)",
  small: "cubic-bezier(0.16, 1, 0.3, 1)",
  reveal: "cubic-bezier(0.16, 1, 0.3, 1)",
  hero: "cubic-bezier(0.16, 1, 0.3, 1)",
  impact: "cubic-bezier(0.4, 0, 0.2, 1)",
} as const;

/** Stagger (ms) per child for entrance/reveal sequences. */
export const MOTION_STAGGER_MS: Record<MotionKey, number> = {
  micro: 0,
  small: 0,
  reveal: 80,
  hero: 120,
  impact: 0,
} as const;

/** Spring configs for interaction-driven motion. */
export const MOTION_SPRING: Record<MotionKey, { damping: number; stiffness: number }> = {
  micro: { damping: 28, stiffness: 420 },   // crisp press/release
  small: { damping: 22, stiffness: 340 },   // snappy but controlled
  reveal: { damping: 20, stiffness: 200 },  // gentle, directed
  hero: { damping: 18, stiffness: 160 },    // grand, slow settle
  impact: { damping: 25, stiffness: 500 },  // punchy impact, fast decay
} as const;

/**
 * motionToken — resolve a Motion key to Framer Motion transition props.
 * Springs for interaction; timing curves for scroll/entrance.
 */
export function motionToken(key: MotionKey) {
  return {
    duration: MOTION_MS[key] / 1000,
    ease: MOTION_EASE[key] as [number, number, number, number] | string,
  };
}

/**
 * springToken — resolve a Motion key to Framer Motion spring props.
 */
export function springToken(key: MotionKey) {
  return {
    type: "spring",
    ...MOTION_SPRING[key],
  };
}

/** GSAP-compatible ease strings. */
export const GSAP_EASE: Record<MotionKey, string> = {
  micro: "power2.out",
  small: "expo.out",
  reveal: "expo.out",
  hero: "expo.out",
  impact: "power2.out",
} as const;

/** Default GSAP scrub for ScrollTrigger — tightly coupled to scroll. */
export const GSAP_SCRUB = 0.35;