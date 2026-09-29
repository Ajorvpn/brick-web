import { GlassSurface } from "@/components/ui/glass_surface";
import { SectionHeading } from "@/components/ui/section_heading";
import { Reveal } from "@/components/animation/reveal";
import { WHAT_IS_BRICK_FACTS } from "@/content/project_facts";

/** §02 What is Brick — editorial statement + verified facts. */
export function WhatIsBrick() {
  return (
    <section
      id="what-is-brick"
      aria-labelledby="what-is-heading"
      className="relative mx-auto max-w-[var(--content-width)] px-6 py-28 sm:px-8 lg:py-40"
    >
      <div className="grid gap-16 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
        <div>
          <Reveal>
            <SectionHeading
              eyebrow="What is Brick"
              title="A free, open-source VPN client — engineered, not marketed."
              lede="Brick is being built in the open as a privacy-focused, Android-first client on a proven native core. No telemetry. No accounts. No dark patterns. Just the unglamorous engineering that a trustworthy VPN requires."
            />
          </Reveal>
          <p id="what-is-heading" className="sr-only">
            What is Brick
          </p>

          <dl className="mt-12 grid gap-x-10 gap-y-8 sm:grid-cols-2">
            {WHAT_IS_BRICK_FACTS.map((fact, i) => (
              <Reveal key={fact.id} delay={0.08 * i}>
                <div className="border-t border-white/10 pt-5">
                  <dt className="font-mono text-[0.68rem] uppercase tracking-[0.2em] text-brick-300">
                    {fact.title}
                  </dt>
                  <dd className="mt-2.5 text-sm leading-relaxed text-ink-200">
                    {fact.body}
                  </dd>
                </div>
              </Reveal>
            ))}
          </dl>
        </div>

        {/* floating fragment — the visual idea of a foundation block */}
        <Reveal delay={0.15} className="relative hidden lg:block">
          <GlassSurface
            level={2}
            glow
            className="absolute right-0 top-6 aspect-[2.1/1] w-[26rem] rotate-[8deg] rounded-[1.1rem]"
            aria-hidden
          >
            <div className="absolute inset-0 rounded-[1.1rem] bg-gradient-to-br from-brick-500/12 via-transparent to-cyan-glow/8" />
            <div className="absolute left-6 right-1/3 top-1/2 h-[10%] -translate-y-1/2 rounded bg-brick-400/80 blur-[0.5px]" />
            <div className="absolute left-6 top-[62%] h-px w-2/5 bg-white/25" />
            <div className="absolute bottom-4 right-5 font-mono text-[0.58rem] uppercase tracking-[0.24em] text-ink-400">
              foundation / 01
            </div>
          </GlassSurface>
          <GlassSurface
            level={1}
            className="absolute left-2 top-40 w-64 rotate-[-6deg] rounded-xl p-5"
            aria-hidden
          >
            <p className="font-mono text-[0.6rem] uppercase tracking-[0.22em] text-ink-300">
              Built in public
            </p>
            <p className="mt-2 text-[0.82rem] leading-relaxed text-ink-200">
              Architecture decisions, security posture and known limitations —
              all documented in the repository.
            </p>
          </GlassSurface>
        </Reveal>
      </div>
    </section>
  );
}
