import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type GlassLevel = 0 | 1 | 2 | 3 | 4 | 5;

export interface GlassSurfaceProps extends HTMLAttributes<HTMLDivElement> {
  /** Material level 0–5. Higher = more presence. */
  level?: GlassLevel;
  /** Soft top inner-glow variant. */
  glow?: boolean;
}

const levelClass: Record<GlassLevel, string> = {
  0: "glass-0",
  1: "glass-1",
  2: "glass-2",
  3: "glass-3",
  4: "glass-4",
  5: "glass-5",
};

/**
 * GlassSurface — the single material primitive of the site.
 * All glass surfaces (cards, nav, pills, sheets) render through this so the
 * material language stays consistent and the fallbacks stay in one place.
 */
export const GlassSurface = forwardRef<HTMLDivElement, GlassSurfaceProps>(
  function GlassSurface(
    { level = 1, glow = false, className, ...props },
    ref,
  ) {
    return (
      <div
        ref={ref}
        className={cn("glass", levelClass[level], glow && "glass-glow", className)}
        {...props}
      />
    );
  },
);
