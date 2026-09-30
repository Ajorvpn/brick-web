"use client";

import { useEffect } from "react";

/** Surfaces that react to the cursor. Kept in one place, matching the CSS. */
const SELECTOR = ".glass, .glass-panel, .glass-lens";

/**
 * GlassPointer — the cursor-reactive inner glow of the glass material.
 *
 * One document-level `pointermove` listener (not one per panel) writes the
 * hovered surface's `--mx` / `--my` custom properties; `.glass::after` paints
 * a radial highlight from those two numbers. Writes are batched into a single
 * animation frame and never touch React state, so moving the cursor across a
 * wall of glass costs no renders and no layout reads beyond one
 * getBoundingClientRect per move on the hovered element.
 *
 * Fine pointers only — on touch there is no cursor to follow.
 */
export function GlassPointer() {
  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      return;
    }

    let frame = 0;
    let pending: { el: HTMLElement; x: number; y: number } | null = null;

    const flush = () => {
      frame = 0;
      const next = pending;
      pending = null;
      if (!next) return;
      next.el.style.setProperty("--mx", `${next.x}%`);
      next.el.style.setProperty("--my", `${next.y}%`);
    };

    const on_pointer_move = (event: PointerEvent) => {
      const from = event.target as Element | null;
      const el = from?.closest?.(SELECTOR) as HTMLElement | null;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      pending = {
        el,
        x: ((event.clientX - rect.left) / rect.width) * 100,
        y: ((event.clientY - rect.top) / rect.height) * 100,
      };
      if (!frame) frame = requestAnimationFrame(flush);
    };

    window.addEventListener("pointermove", on_pointer_move, { passive: true });
    return () => {
      window.removeEventListener("pointermove", on_pointer_move);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}
