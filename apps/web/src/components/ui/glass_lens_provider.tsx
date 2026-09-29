"use client";

/**
 * GlassLensProvider — mounts the shared SVG displacement-map filter once.
 *
 * `.glass-lens` elements reference it through
 * `backdrop-filter: url(#brick-lens)`, which genuinely refracts the DOM
 * content behind them (the website-glass technique). Mounted once in the
 * root layout; costs a few bytes of static SVG, no runtime JS.
 */
export function GlassLensProvider() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      style={{ position: "absolute", width: 0, height: 0, pointerEvents: "none" }}
    >
      <defs>
        <filter id="brick-lens" x="-20%" y="-20%" width="140%" height="140%">
          {/* Slight blur softens the sampled backdrop before displacement */}
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.4" result="soft" />
          {/* Radial displacement map: pixels push outward from the center,
              the signature lens refraction of liquid glass */}
          <feImage
            href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cdefs%3E%3CradialGradient id='g' cx='50%25' cy='50%25' r='65%25'%3E%3Cstop offset='0%25' stop-color='%237f7f7f'/%3E%3Cstop offset='40%25' stop-color='%23808080'/%3E%3Cstop offset='100%25' stop-color='%23cfcfcf'/%3E%3C/radialGradient%3E%3C/defs%3E%3Crect width='200' height='200' fill='url(%23g)'/%3E%3C/svg%3E"
            result="map"
            preserveAspectRatio="none"
          />
          <feDisplacementMap
            in="soft"
            in2="map"
            scale={6}
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
    </svg>
  );
}
