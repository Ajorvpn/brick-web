import {
  REPO_URL,
  REPO_ISSUES_URL,
  REPO_LICENSE_URL,
  PROJECT_EMAIL,
} from "@/content/project_facts";

const section_links = [
  { href: "#what-is-brick", label: "What is Brick" },
  { href: "#development", label: "Development" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#protocols", label: "Protocols" },
  { href: "#security", label: "Security" },
  { href: "#roadmap", label: "Roadmap" },
] as const;

const project_links = [
  { href: REPO_URL, label: "GitHub repository", external: true },
  { href: `mailto:${PROJECT_EMAIL}`, label: PROJECT_EMAIL, external: true },
  { href: REPO_ISSUES_URL, label: "Issue tracker", external: true },
  { href: REPO_LICENSE_URL, label: "GPL v3 license", external: true },
  { href: "/docs", label: "Documentation", external: false },
  { href: "/docs/roadmap", label: "Roadmap notes", external: false },
] as const;

/** Footer — real destinations only. No fake socials, no fake metrics. */
export function SiteFooter() {
  return (
    <footer className="glass glass-2 relative mt-10 rounded-none border-x-0 border-b-0">
      <div className="mx-auto max-w-[var(--content-width)] px-6 py-14 sm:px-8">
        <div className="grid gap-10 md:grid-cols-[1.2fr_1fr_1fr]">
          <div>
            <p className="font-mono text-sm font-semibold uppercase tracking-[0.28em] text-ink-050">
              Brick
            </p>
            <p className="mt-3 max-w-xs text-[0.84rem] leading-relaxed text-ink-400">
              A free, open-source VPN client built in the public. Privacy by
              architecture — brick by brick.
            </p>
            <p className="mt-5 font-mono text-[0.62rem] uppercase tracking-[0.22em] text-ink-500">
              Free · Open source · Privacy first
            </p>
          </div>

          <nav aria-label="Site sections">
            <p className="font-mono text-[0.62rem] uppercase tracking-[0.24em] text-ink-400">
              Explore
            </p>
            <ul className="mt-4 space-y-2.5">
              {section_links.map((l) => (
                <li key={l.href}>
                  <a
                    className="text-[0.86rem] text-ink-300 transition-colors hover:text-ink-050"
                    href={l.href}
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Project links">
            <p className="font-mono text-[0.62rem] uppercase tracking-[0.24em] text-ink-400">
              Project
            </p>
            <ul className="mt-4 space-y-2.5">
              {project_links.map((l) => (
                <li key={l.href}>
                  <a
                    className="inline-flex items-center gap-1.5 text-[0.86rem] text-ink-300 transition-colors hover:text-ink-050"
                    href={l.href}
                    {...(l.external
                      ? { target: "_blank", rel: "noopener noreferrer" }
                      : {})}
                  >
                    {l.label}
                    {l.external && (
                      <span aria-hidden className="text-ink-500">
                        ↗
                      </span>
                    )}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-white/6 pt-6 text-[0.74rem] text-ink-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Brick VPN contributors. GPL v3.</p>
          <p className="font-mono text-[0.66rem] uppercase tracking-[0.18em]">
            In active development — no stable release yet
          </p>
        </div>
      </div>
    </footer>
  );
}
