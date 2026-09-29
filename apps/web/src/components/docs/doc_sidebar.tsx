"use client";

import Link from "next/link";
import { useState } from "react";
import { GlassSurface } from "@/components/ui/glass_surface";
import { DOC_PAGES } from "@/content/docs_content";

/**
 * DocsSidebar — sticky glass navigation for /docs. On mobile it collapses
 * into a horizontal scroll strip above the content.
 */
export function DocsSidebar({ active }: { active: string }) {
  const [open, set_open] = useState(false);

  return (
    <>
      {/* mobile strip */}
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => set_open((v) => !v)}
          aria-expanded={open}
          aria-controls="docs-mobile-nav"
          className="glass glass-2 mb-4 flex w-full items-center justify-between rounded-xl px-4 py-3 text-[0.88rem] text-ink-100"
        >
          <span>
            {DOC_PAGES.find((p) => p.slug === active)?.title ?? "Documentation"}
          </span>
          <span aria-hidden className="text-ink-400">
            {open ? "▲" : "▼"}
          </span>
        </button>
        {open && (
          <GlassSurface level={5} id="docs-mobile-nav" className="mb-6 rounded-xl p-2">
            <nav aria-label="Documentation">
              <ul className="space-y-0.5">
                {DOC_PAGES.map((p) => (
                  <li key={p.slug}>
                    <Link
                      href={`/docs/${p.slug}`}
                      className={
                        "block rounded-lg px-3.5 py-2.5 text-[0.9rem] " +
                        (p.slug === active
                          ? "bg-brick-400/15 text-ink-050"
                          : "text-ink-300 hover:bg-white/6 hover:text-ink-050")
                      }
                    >
                      {p.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </GlassSurface>
        )}
      </div>

      {/* desktop sticky sidebar */}
      <div className="hidden lg:block">
        <div className="sticky top-28">
          <p className="mb-3 px-3 font-mono text-[0.62rem] uppercase tracking-[0.24em] text-ink-400">
            Documentation
          </p>
          <nav aria-label="Documentation">
            <GlassSurface level={1} className="rounded-2xl p-2">
              <ul className="space-y-0.5">
                {DOC_PAGES.map((p) => (
                  <li key={p.slug}>
                    <Link
                      href={`/docs/${p.slug}`}
                      aria-current={p.slug === active ? "page" : undefined}
                      className={
                        "block rounded-lg px-3.5 py-2.5 text-[0.88rem] transition-colors " +
                        (p.slug === active
                          ? "bg-brick-400/15 font-medium text-ink-050"
                          : "text-ink-300 hover:bg-white/6 hover:text-ink-050")
                      }
                    >
                      {p.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </GlassSurface>
          </nav>
          <p className="mt-4 px-3 text-[0.72rem] leading-relaxed text-ink-500">
            Summarized from the repository&rsquo;s governance docs. The repo is
            the source of truth.
          </p>
        </div>
      </div>
    </>
  );
}
