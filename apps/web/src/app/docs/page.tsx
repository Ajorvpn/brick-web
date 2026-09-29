import type { Metadata } from "next";
import Link from "next/link";
import { GlassSurface } from "@/components/ui/glass_surface";
import { DOC_PAGES } from "@/content/docs_content";

export const metadata: Metadata = {
  title: "Documentation",
};

export default function DocsIndex() {
  return (
    <main id="main" className="mx-auto max-w-[var(--content-width)] px-6 py-16 sm:px-8 lg:py-24">
      <p className="font-mono text-[0.68rem] uppercase tracking-[0.24em] text-brick-300">
        Brick documentation
      </p>
      <h1 className="mt-4 max-w-2xl text-balance text-4xl font-semibold tracking-tight text-ink-050 sm:text-5xl">
        Read how Brick is actually built.
      </h1>
      <p className="mt-5 max-w-2xl text-[1.02rem] leading-relaxed text-ink-300">
        Honest documentation summarized from the repository&rsquo;s engineering
        files — what exists, what does not, and why decisions were made.
      </p>

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {DOC_PAGES.map((page) => (
          <Link key={page.slug} href={`/docs/${page.slug}`} className="group">
            <GlassSurface
              level={2}
              className="h-full rounded-2xl p-6 transition-colors group-hover:border-white/25"
            >
              <h2 className="text-[1.05rem] font-semibold tracking-tight text-ink-050">
                {page.title}
              </h2>
              <p className="mt-2 text-[0.86rem] leading-relaxed text-ink-300">
                {page.description}
              </p>
              <p className="mt-4 font-mono text-[0.6rem] uppercase tracking-[0.18em] text-ink-500">
                source: {page.source}
              </p>
            </GlassSurface>
          </Link>
        ))}
      </div>
    </main>
  );
}
