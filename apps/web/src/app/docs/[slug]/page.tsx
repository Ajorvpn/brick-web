import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DocsSidebar } from "@/components/docs/doc_sidebar";
import { DocBlockRenderer } from "@/components/docs/doc_block_renderer";
import { DOC_PAGES, get_doc_page } from "@/content/docs_content";

export function generateStaticParams() {
  return DOC_PAGES.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/docs/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const page = get_doc_page(slug);
  if (!page) return { title: "Not found" };
  return { title: page.title, description: page.description };
}

export default async function DocPage({
  params,
}: PageProps<"/docs/[slug]">) {
  const { slug } = await params;
  const page = get_doc_page(slug);
  if (!page) notFound();

  return (
    <main
      id="main"
      className="mx-auto grid max-w-[var(--content-width)] gap-10 px-6 py-12 sm:px-8 lg:grid-cols-[16rem_1fr] lg:py-16"
    >
      <DocsSidebar active={page.slug} />

      <article className="min-w-0 max-w-3xl">
        {/* breadcrumbs */}
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex items-center gap-2 font-mono text-[0.66rem] uppercase tracking-[0.18em] text-ink-500">
            <li>
              <Link href="/docs" className="transition-colors hover:text-ink-200">
                docs
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li aria-current="page" className="text-ink-300">
              {page.slug}
            </li>
          </ol>
        </nav>

        <h1 className="text-balance text-4xl font-semibold tracking-tight text-ink-050 sm:text-[2.6rem]">
          {page.title}
        </h1>
        <p className="mt-4 text-[1rem] leading-relaxed text-ink-300">
          {page.description}
        </p>
        <p className="mt-3 font-mono text-[0.62rem] uppercase tracking-[0.18em] text-ink-500">
          source: {page.source}
        </p>

        <div className="mt-6 border-t border-white/8 pt-2">
          {page.blocks.map((block, i) => (
            <DocBlockRenderer key={i} block={block} />
          ))}
        </div>

        {/* pager */}
        <nav
          aria-label="Documentation pagination"
          className="mt-14 flex justify-between gap-4 border-t border-white/8 pt-6"
        >
          {(() => {
            const idx = DOC_PAGES.findIndex((p) => p.slug === page.slug);
            const prev = idx > 0 ? DOC_PAGES[idx - 1] : undefined;
            const next =
              idx >= 0 && idx < DOC_PAGES.length - 1
                ? DOC_PAGES[idx + 1]
                : undefined;
            return (
              <>
                {prev ? (
                  <Link
                    href={`/docs/${prev.slug}`}
                    className="text-[0.88rem] text-ink-300 transition-colors hover:text-ink-050"
                  >
                    ← {prev.title}
                  </Link>
                ) : (
                  <span />
                )}
                {next ? (
                  <Link
                    href={`/docs/${next.slug}`}
                    className="text-[0.88rem] text-ink-300 transition-colors hover:text-ink-050"
                  >
                    {next.title} →
                  </Link>
                ) : (
                  <Link
                    href="/"
                    className="text-[0.88rem] text-ink-300 transition-colors hover:text-ink-050"
                  >
                    Back to site →
                  </Link>
                )}
              </>
            );
          })()}
        </nav>
      </article>
    </main>
  );
}
