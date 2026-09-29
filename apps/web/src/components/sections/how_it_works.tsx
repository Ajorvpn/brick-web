import { GlassSurface } from "@/components/ui/glass_surface";
import { SectionHeading } from "@/components/ui/section_heading";
import { StatusBadge } from "@/components/ui/status_badge";
import { Reveal } from "@/components/animation/reveal";
import {
  ARCHITECTURE_LAYERS,
  LIFECYCLE_STATES,
} from "@/content/project_facts";

/**
 * §05 How Brick works — the spatial stack. Each layer is a glass slab that
 * rises into position; connected by a vertical light seam.
 */
export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      aria-labelledby="how-heading"
      className="relative overflow-hidden border-t border-white/5 bg-ink-900/40"
    >
      {/* ambient light behind the stack */}
      <div
        aria-hidden
        className="absolute left-1/2 top-1/2 -z-10 h-[36rem] w-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brick-500/8 blur-[120px]"
      />

      <div className="mx-auto max-w-[var(--content-width)] px-6 py-28 sm:px-8 lg:py-36">
        <Reveal>
          <SectionHeading
            eyebrow="How Brick works"
            title="One contract from tap to tunnel."
            lede="Every layer below is real, verifiable code in the repository. The app talks to an interface; the platform plugs in underneath."
          />
        </Reveal>
        <p id="how-heading" className="sr-only">
          How Brick works
        </p>

        <div className="mt-16 grid gap-14 lg:grid-cols-[1fr_auto_1fr] lg:items-start">
          {/* the spatial stack */}
          <Reveal className="lg:order-1">
            <ol className="relative space-y-3">
              {/* light seam */}
              <div
                aria-hidden
                className="absolute bottom-4 left-6 top-4 w-px bg-gradient-to-b from-brick-400/60 via-white/15 to-cyan-glow/40"
              />
              {ARCHITECTURE_LAYERS.map((layer, i) => (
                <li key={layer.id} className="relative list-none">
                  <GlassSurface
                    level={layer.status === "implemented" ? 2 : 1}
                    className="ml-12 rounded-xl p-5"
                    style={{ marginLeft: `${3 + (i % 3) * 0.75}rem` } as never}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-mono text-[0.6rem] uppercase tracking-[0.22em] text-ink-400">
                        {layer.kind}
                      </span>
                      <StatusBadge status={layer.status} />
                    </div>
                    <h3 className="mt-2 text-[1.05rem] font-semibold tracking-tight text-ink-050">
                      {layer.name}
                    </h3>
                    <p className="mt-1.5 text-[0.88rem] leading-relaxed text-ink-300">
                      {layer.body}
                    </p>
                  </GlassSurface>
                </li>
              ))}
              <li aria-hidden className="ml-12 list-none pt-1 font-mono text-[0.6rem] uppercase tracking-[0.24em] text-ink-400">
                ↓ the tunnel
              </li>
            </ol>
          </Reveal>

          {/* vertical annotation */}
          <Reveal delay={0.1} className="hidden self-center lg:order-2 lg:block">
            <div
              aria-hidden
              className="flex h-[34rem] w-16 flex-col items-center justify-center gap-4"
            >
              <div className="h-full w-px bg-gradient-to-b from-transparent via-white/15 to-transparent" />
            </div>
          </Reveal>

          {/* lifecycle */}
          <Reveal delay={0.15} className="lg:order-3">
            <GlassSurface
              level={3}
              glow
              className="rounded-2xl p-7 lg:sticky lg:top-28"
            >
              <p className="font-mono text-[0.62rem] uppercase tracking-[0.24em] text-brick-300">
                Connection lifecycle
              </p>
              <h3 className="mt-3 text-xl font-semibold tracking-tight text-ink-050">
                A state machine, not a hope.
              </h3>
              <p className="mt-3 text-[0.9rem] leading-relaxed text-ink-300">
                The engine contract defines exactly which transitions are legal.
                Impossible transitions are refused — the class of bug where a
                client shows &ldquo;connected&rdquo; over a dead tunnel is
                designed out.
              </p>

              <ol className="mt-7 space-y-0">
                {LIFECYCLE_STATES.filter((s) => s.id !== "error").map(
                  (state, i, arr) => (
                    <li key={state.id} className="list-none">
                      <div className="flex items-baseline gap-3">
                        <span
                          aria-hidden
                          className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brick-400 shadow-[0_0_8px_rgb(224_85_47/0.7)]"
                        />
                        <div className="pb-5">
                          <p className="font-mono text-[0.78rem] font-medium uppercase tracking-[0.14em] text-ink-100">
                            {state.label}
                          </p>
                          <p className="mt-1 text-[0.8rem] leading-relaxed text-ink-400">
                            {state.description}
                          </p>
                        </div>
                      </div>
                      {i < arr.length - 1 && (
                        <div
                          aria-hidden
                          className="ml-[2px] h-4 w-px bg-white/15"
                        />
                      )}
                    </li>
                  ),
                )}
                <li className="list-none border-t border-dashed border-white/12 pt-4">
                  <div className="flex items-baseline gap-3">
                    <span
                      aria-hidden
                      className="mt-1.5 size-1.5 shrink-0 rounded-full border border-brick-400 bg-transparent"
                    />
                    <div>
                      <p className="font-mono text-[0.78rem] font-medium uppercase tracking-[0.14em] text-ink-200">
                        Error — the honest branch
                      </p>
                      <p className="mt-1 text-[0.8rem] leading-relaxed text-ink-400">
                        {
                          LIFECYCLE_STATES.find((s) => s.id === "error")
                            ?.description
                        }
                      </p>
                    </div>
                  </div>
                </li>
              </ol>
            </GlassSurface>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
