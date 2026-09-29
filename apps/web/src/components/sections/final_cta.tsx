import { GlassSurface } from "@/components/ui/glass_surface";
import { BrickButtonLink } from "@/components/ui/brick_button";
import { Reveal } from "@/components/animation/reveal";
import { REPO_URL } from "@/content/project_facts";

/** §10 Final CTA — the brick, calm and reassembled. */
export function FinalCta() {
  return (
    <section
      id="contribute"
      aria-labelledby="cta-heading"
      className="relative overflow-hidden border-t border-white/5"
    >
      {/* calm reassembled-brick aura */}
      <div
        aria-hidden
        className="absolute left-1/2 top-1/2 -z-10 h-[30rem] w-[44rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brick-500/7 blur-[130px]"
      />

      <div className="mx-auto max-w-[var(--content-width)] px-6 py-32 text-center sm:px-8 lg:py-44">
        <Reveal>
          {/* the reassembled brick, minimal */}
          <GlassSurface
            level={3}
            glow
            aria-hidden
            className="mx-auto aspect-[2.2/1] w-56 rotate-[-4deg] rounded-xl sm:w-72"
          >
            <div className="absolute inset-x-5 top-1/2 h-[16%] -translate-y-1/2 rounded bg-gradient-to-r from-brick-500/90 to-brick-400/80" />
            <div className="absolute inset-x-5 top-1/2 h-px -translate-y-[130%] bg-white/25" />
            <div className="absolute right-3 top-2 size-1 rounded-full bg-cyan-glow/80" />
          </GlassSurface>
        </Reveal>

        <Reveal delay={0.1}>
          <h2
            id="cta-heading"
            className="mx-auto mt-14 max-w-3xl text-balance text-4xl font-semibold tracking-[-0.03em] text-ink-050 sm:text-6xl"
          >
            Good software takes foundations.
          </h2>
        </Reveal>

        <Reveal delay={0.18}>
          <p className="mx-auto mt-6 max-w-xl text-pretty text-lg leading-relaxed text-ink-300">
            Watch Brick take shape, read the architecture, or help lay the next
            brick.
          </p>
        </Reveal>

        <Reveal delay={0.26}>
          <div className="mt-11 flex flex-wrap items-center justify-center gap-4">
            <BrickButtonLink
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              size="lg"
              className="glass-lens"
            >
              Follow the build on GitHub
              <span aria-hidden>↗</span>
            </BrickButtonLink>
            <BrickButtonLink href="/docs" variant="secondary" size="lg">
              Read the docs
            </BrickButtonLink>
          </div>
        </Reveal>

        <Reveal delay={0.3}>
          <p className="mt-10 font-mono text-[0.66rem] uppercase tracking-[0.24em] text-ink-500">
            Free · GPL v3 · No telemetry
          </p>
        </Reveal>
      </div>
    </section>
  );
}
