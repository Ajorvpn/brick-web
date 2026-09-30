"use client";

import { useEffect } from "react";

/** The filter id referenced by styles/glass_material.css. */
export const GLASS_DISTORTION_ID = "glass-distortion";

/** Set on <html> once refraction is known to work; CSS keys off it. */
export const GLASS_LENS_ATTR = "data-glass-lens";

/**
 * Supports SVG filter references inside backdrop-filter.
 *
 * Only a couple of engines answer yes. The CSS is written so the answer
 * only ever *adds* refraction: the blur+saturate material is declared
 * separately and stays valid whatever this returns.
 */
export function supportsBackdropSvgFilter(): boolean {
  if (typeof CSS === "undefined" || typeof CSS.supports !== "function") {
    return false;
  }
  return (
    CSS.supports("backdrop-filter", "url(#glass-distortion)") ||
    CSS.supports("-webkit-backdrop-filter", "url(#glass-distortion)")
  );
}

/**
 * GlassLensProvider — mounts the SVG filters the glass material refracts
 * through, and decides whether the engine may use them.
 *
 * Two filters, one technique (feTurbulence → feGaussianBlur →
 * feDisplacementMap, the standard web approximation of Apple's Liquid Glass
 * pixel displacement):
 *
 *   #glass-distortion  the reference implementation — fine noise, scale 40,
 *                      for panels 120px and up (nav, cards, sheets)
 *   #glass-distortion-soft  same shape, gentler (scale 10, tighter noise) so
 *                      small pills and buttons wobble without smearing
 *
 * The capability flag is only set after mount AND after confirming the filter
 * element is really in the DOM (a dangling reference would invalidate
 * backdrop-filter in Chromium, which is the failure mode that made v2 flat).
 */
export function GlassLensProvider() {
  useEffect(() => {
    const root = document.documentElement;
    const mounted = document.getElementById(GLASS_DISTORTION_ID) !== null;
    root.setAttribute(
      GLASS_LENS_ATTR,
      mounted && supportsBackdropSvgFilter() ? "on" : "off",
    );
    return () => {
      root.removeAttribute(GLASS_LENS_ATTR);
    };
  }, []);

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      data-testid="glass-lens-defs"
      style={{ position: "absolute", width: 0, height: 0, pointerEvents: "none" }}
    >
      <defs>
        {/* Reference filter — exactly the documented technique. */}
        <filter
          id={GLASS_DISTORTION_ID}
          x="-20%"
          y="-20%"
          width="140%"
          height="140%"
          colorInterpolationFilters="sRGB"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.008 0.008"
            numOctaves="2"
            seed="4"
            result="noise"
          />
          <feGaussianBlur in="noise" stdDeviation="2" result="blurredNoise" />
          <feDisplacementMap
            in="SourceGraphic"
            in2="blurredNoise"
            scale="40"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>

        {/* Same technique, tuned for small surfaces (pills, buttons). */}
        <filter
          id="glass-distortion-soft"
          x="-20%"
          y="-20%"
          width="140%"
          height="140%"
          colorInterpolationFilters="sRGB"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.02 0.02"
            numOctaves="2"
            seed="7"
            result="noise"
          />
          <feGaussianBlur in="noise" stdDeviation="1.2" result="blurredNoise" />
          <feDisplacementMap
            in="SourceGraphic"
            in2="blurredNoise"
            scale="10"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
    </svg>
  );
}
