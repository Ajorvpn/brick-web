import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Documentation",
  description:
    "Brick VPN documentation — architecture, security posture, protocols, development status and roadmap, summarized from the repository.",
};

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-svh">
      <header className="border-b border-white/8 bg-ink-950/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-[var(--content-width)] items-center justify-between px-6 py-4 sm:px-8">
          <Link
            href="/"
            className="flex items-center gap-2.5 font-mono text-[0.8rem] font-semibold uppercase tracking-[0.24em] text-ink-050 transition-colors hover:text-brick-300"
          >
            <span
              aria-hidden
              className="inline-block size-3 rounded-[2.5px] bg-gradient-to-br from-brick-400 to-brick-700"
            />
            Brick
          </Link>
          <nav aria-label="Documentation header" className="flex items-center gap-5">
            <Link
              href="/docs"
              className="text-[0.84rem] text-ink-300 transition-colors hover:text-ink-050"
            >
              Overview
            </Link>
            <Link
              href="/"
              className="text-[0.84rem] text-ink-300 transition-colors hover:text-ink-050"
            >
              ← Back to site
            </Link>
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}
