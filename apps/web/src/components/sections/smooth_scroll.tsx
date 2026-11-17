"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/**
 * SmoothScroll — Lenis supplies the scroll momentum, ScrollTrigger consumes
 * it. There is exactly one smoothing stage in the page: the scrubbed timeline
 * is attached to ScrollTrigger with `scrub: true`, so nothing is smoothed
 * twice (which is what makes a scrubbed scene feel like syrup).
 *
 * Lenis drives ScrollTrigger through gsap.ticker, so both run on the same
 * frame as the WebGL renderer. Touch scrolling stays native: the timeline
 * follows it the same way, and a phone keeps its own momentum.
 */
export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({
      lerp: 0.09,
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.15,
    });

    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    // Lenis reimplements the scrolling, so the CSS smooth-scroll would fight it
    const previous = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = "auto";

    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      document.documentElement.style.scrollBehavior = previous;
    };
  }, []);

  return null;
}