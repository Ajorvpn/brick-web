import { GlassSurface } from "@/components/ui/glass_surface";
import { BrickButtonLink } from "@/components/ui/brick_button";
import { SectionHeading } from "@/components/ui/section_heading";
import { Reveal } from "@/components/animation/reveal";
import {
  REPO_URL,
  REPO_ISSUES_URL,
  REPO_LICENSE_URL,
  PROJECT_EMAIL,
} from "@/content/project_facts";

/** GitHub mark — inline SVG, no external dependency. */
function GithubMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden className={className} fill="currentColor">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  );
}

const open_layers = [
  { id: "code", label: "Source", note: "Every line is public" },
  { id: "architecture", label: "Architecture", note: "Decisions documented" },
  { id: "security", label: "Security", note: "Threat model published" },
  { id: "tests", label: "Tests", note: "575 passing in the monorepo" },
] as const;

/**
 * §08 Open source — the brick opened up. Inside: the layers that make it
 * trustworthy. GPL v3. Real repository links only.
 */
export function OpenSource() {
  return (
    <section
      id="open-source"
      aria-labelledby="open-heading"
      className="relative border-t border-white/5"
    >
      <div className="mx-auto max-w-[var(--content-width)] px-6 py-28 sm:px-8 lg:py-36">
        <Reveal>
          <SectionHeading
            eyebrow="Open source"
            title="Built in the open. Kept open."
            lede="Brick is licensed GPL v3 — commercial forks must stay open. Architecture decisions, security posture and known limitations are published in the repository, because trust is built by showing the work."
          />
        </Reveal>
        <p id="open-heading" className="sr-only">
          Open source
        </p>

        {/* the opened brick */}
        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {open_layers.map((layer, i) => (
            <Reveal key={layer.id} delay={0.06 * i}>
              <GlassSurface
                level={2}
                className="relative h-full overflow-hidden rounded-xl p-5"
              >
                <span
                  aria-hidden
                  className="absolute right-4 top-4 font-mono text-[0.55rem] uppercase tracking-[0.2em] text-ink-500"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div
                  aria-hidden
                  className="h-1 w-10 rounded-full bg-gradient-to-r from-brick-400 to-brick-600"
                />
                <h3 className="mt-4 text-[0.98rem] font-semibold tracking-tight text-ink-050">
                  {layer.label}
                </h3>
                <p className="mt-1.5 text-[0.83rem] leading-relaxed text-ink-300">
                  {layer.note}
                </p>
              </GlassSurface>
            </Reveal>
          ))}
        </div>

        {/* contact block: GitHub + email */}
        <Reveal delay={0.12}>
          <GlassSurface level={3} glow className="mt-12 rounded-2xl p-7 sm:p-9">
            <p className="font-mono text-[0.62rem] uppercase tracking-[0.24em] text-brick-300">
              Built in the open
            </p>
            <h3 className="mt-3 text-xl font-semibold tracking-tight text-ink-050 sm:text-2xl">
              Questions, feedback, or ideas?
            </h3>
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <BrickButtonLink
                href={REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                size="lg"
                className="glass-lens"
              >
                <GithubMark className="size-4" />
                View on GitHub
              </BrickButtonLink>
              <BrickButtonLink
                href={`mailto:${PROJECT_EMAIL}`}
                variant="secondary"
                size="lg"
              >
                Email the project
              </BrickButtonLink>
            </div>
            <p className="mt-4 font-mono text-[0.72rem] tracking-wide text-ink-400">
              {PROJECT_EMAIL}
            </p>
          </GlassSurface>
        </Reveal>

        <Reveal delay={0.18}>
          <div className="mt-8 flex flex-wrap items-center gap-5">
            <BrickButtonLink
              href={REPO_ISSUES_URL}
              target="_blank"
              rel="noopener noreferrer"
              variant="ghost"
              size="md"
            >
              Report an issue →
            </BrickButtonLink>
            <a
              href={REPO_LICENSE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[0.72rem] uppercase tracking-[0.18em] text-ink-400 underline decoration-white/20 underline-offset-4 transition-colors hover:text-ink-200"
            >
              GPL v3 license
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
