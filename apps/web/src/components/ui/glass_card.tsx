import { forwardRef, type HTMLAttributes } from "react";
import { GlassSurface, type GlassLevel } from "./glass_surface";
import { cn } from "@/lib/utils";

export interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  level?: GlassLevel;
  glow?: boolean;
  /** Desktop-only pointer tilt. Disabled on touch and reduced motion. */
  tilt?: boolean;
}

/**
 * GlassCard — content container on the glass material.
 * `tilt` adds a subtle pointer-driven 3D lean on fine pointers; it is a
 * CSS/JS enhancement and never the only way to receive information.
 */
export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  function GlassCard({ level = 2, glow, tilt = false, className, children, ...props }, ref) {
    return (
      <GlassSurface
        ref={ref}
        level={level}
        glow={glow}
        className={cn("overflow-hidden", tilt && "tilt-card", className)}
        data-tilt={tilt ? "true" : undefined}
        {...props}
      >
        {children}
      </GlassSurface>
    );
  },
);
