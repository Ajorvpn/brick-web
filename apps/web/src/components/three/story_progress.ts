/**
 * The single number the story is made of.
 *
 * The DOM owns scroll; the scene owns pixels. Neither should re-render the
 * other, so progress travels through this module: the story writes `p` from
 * its ScrollTrigger (Lenis-smoothed, GSAP-scrubbed), and the scene reads it
 * once per frame. No React state, no context, no re-render at 60 Hz.
 *
 * `p` is the master timeline position, 0..1. Everything the wall does — the
 * keystone's descent, the lay, the impact burst, the reveal — is a pure
 * function of it, which is what makes the whole sequence exactly reversible
 * and the debug hook deterministic.
 */
export const story_progress = {
  /** 0..1 master timeline position */
  p: 0,
  /** true once the canvas has drawn its first frame */
  ready: false,
};

/** Beat map — the timeline's named labels, in one place. */
export const BEATS = {
  hero: 0.0,
  handoff: 0.1,
  descentStart: 0.08,
  descentEnd: 0.3,
  layStart: 0.3,
  /** the keystone is pressed home; the impact burst fires here */
  impact: 0.45,
  revealStart: 0.46,
  revealEnd: 0.66,
  recedeStart: 0.66,
  recedeEnd: 0.88,
  releaseEnd: 1.0,
} as const;

export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

export function smoothstep(e0: number, e1: number, x: number): number {
  const t = clamp01((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
}

/**
 * window — 0..1 envelope that rises over [a, b] and falls over [c, d].
 * Used for anything that should appear, hold, and leave without a timer.
 */
export function window4(p: number, a: number, b: number, c: number, d: number) {
  return smoothstep(a, b, p) * (1 - smoothstep(c, d, p));
}

/**
 * impact_age — 0 before the keystone lands, 1 once the burst is over.
 * Every impact effect reads this, so scrubbing backwards rewinds the dust
 * into the joint instead of leaving it hanging in the air.
 */
export function impact_age(p: number): number {
  return clamp01((p - BEATS.impact) / 0.17);
}

/** The spike itself: a narrow lobe centred on the impact. */
export function impact_spike(p: number): number {
  const d = (p - BEATS.impact) / 0.012;
  if (d < 0 || d > 1) return 0;
  return Math.sin(d * Math.PI);
}