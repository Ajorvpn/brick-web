"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { GlassSurface } from "@/components/ui/glass_surface";
import { BrickButtonLink } from "@/components/ui/brick_button";
import { REPO_URL } from "@/content/project_facts";

const nav_links = [
  { href: "/#what-is-brick", label: "What is Brick" },
  { href: "/#development", label: "Status" },
  { href: "/#how-it-works", label: "Technology" },
  { href: "/#security", label: "Security" },
  { href: "/docs", label: "Docs" },
] as const;

/**
 * FloatingNav — compact glass pill. Gains depth on scroll; opens a glass
 * sheet on mobile. Native-feeling, keyboard complete.
 */
export function FloatingNav() {
  const [scrolled, set_scrolled] = useState(false);
  const [open, set_open] = useState(false);

  useEffect(() => {
    const on_scroll = () => set_scrolled(window.scrollY > 24);
    on_scroll();
    window.addEventListener("scroll", on_scroll, { passive: true });
    return () => window.removeEventListener("scroll", on_scroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const on_key = (e: KeyboardEvent) => {
      if (e.key === "Escape") set_open(false);
    };
    window.addEventListener("keydown", on_key);
    return () => window.removeEventListener("keydown", on_key);
  }, [open]);

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-[max(0.9rem,env(safe-area-inset-top))]">
      <GlassSurface
        level={scrolled ? 4 : 2}
        className={
          "pointer-events-auto flex items-center gap-1 rounded-full py-2 pl-5 pr-2 transition-all duration-300 glass-lens " +
          (scrolled ? "shadow-[var(--shadow-3)]" : "")
        }
        role="navigation"
        aria-label="Main"
      >
        {/* wordmark */}
        <Link
          href="/#top"
          className="mr-3 flex items-center gap-2.5 rounded-full font-mono text-[0.82rem] font-semibold uppercase tracking-[0.24em] text-ink-050 outline-offset-4"
        >
          <span aria-hidden className="relative inline-block size-3.5 rounded-[3px] bg-gradient-to-br from-brick-400 to-brick-700 shadow-[inset_0_1px_0_rgb(255_255_255/0.35)]" />
          Brick
        </Link>

        {/* desktop links */}
        <nav aria-label="Sections" className="hidden items-center md:flex">
          {nav_links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-full px-3.5 py-2 text-[0.84rem] text-ink-200 transition-colors hover:bg-white/8 hover:text-ink-050 focus-visible:bg-white/8 focus-visible:text-ink-050"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="ml-2 hidden md:block">
          <BrickButtonLink
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="h-9 px-4 text-[0.82rem]"
            aria-label="Brick on GitHub"
          >
            <svg viewBox="0 0 16 16" aria-hidden className="size-3.5" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
            </svg>
            GitHub
          </BrickButtonLink>
        </div>

        {/* mobile menu button */}
        <button
          type="button"
          onClick={() => set_open((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          className="ml-1 flex size-9 items-center justify-center rounded-full text-ink-100 transition-colors hover:bg-white/10 md:hidden"
        >
          <span aria-hidden className="relative block h-3 w-4">
            <span
              className={
                "absolute left-0 top-0 h-[1.5px] w-4 bg-current transition-transform duration-200 " +
                (open ? "translate-y-[5.5px] rotate-45" : "")
              }
            />
            <span
              className={
                "absolute bottom-0 left-0 h-[1.5px] w-4 bg-current transition-transform duration-200 " +
                (open ? "-translate-y-[5.5px] -rotate-45" : "")
              }
            />
          </span>
        </button>
      </GlassSurface>

      {/* mobile sheet */}
      {open && (
        <div
          id="mobile-menu"
          className="pointer-events-auto absolute inset-x-4 top-[calc(env(safe-area-inset-top)+4.6rem)] md:hidden"
        >
          <GlassSurface level={5} className="rounded-2xl p-3 shadow-[var(--shadow-4)]">
            <nav aria-label="Sections">
              <ul className="space-y-1">
                {nav_links.map((l) => (
                  <li key={l.href}>
                    <a
                      href={l.href}
                      onClick={() => set_open(false)}
                      className="block rounded-xl px-4 py-3 text-[0.95rem] text-ink-100 transition-colors hover:bg-white/8 focus-visible:bg-white/8"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
                <li className="pt-2">
                  <BrickButtonLink
                    href={REPO_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full"
                  >
                    GitHub ↗
                  </BrickButtonLink>
                </li>
              </ul>
            </nav>
          </GlassSurface>
        </div>
      )}
    </header>
  );
}
