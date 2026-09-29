import { GlassSurface } from "@/components/ui/glass_surface";
import { SectionHeading } from "@/components/ui/section_heading";
import { StatusBadge } from "@/components/ui/status_badge";
import { Reveal } from "@/components/animation/reveal";
import { SECURITY_PRINCIPLES } from "@/content/project_facts";

/**
 * §07 Security philosophy — a transparent protective shell around a calm
 * core. No hacker aesthetics; verified engineering posture only.
 */
export function Security() {
  return (
    <section
      id="security"
      aria-labelledby="security-heading"
      className="relative overflow-hidden border-t border-white/5 bg-ink-900/40"
    >
      <div className="mx-auto max-w-[var(--content-width)] px-6 py-28 sm:px-8 lg:py-36">
        <div className="grid gap-16 lg:grid-cols-[0.95fr_1.05fr] lg:gap-20">
          <div>
            <Reveal>
              <SectionHeading
                eyebrow="Security philosophy"
                title="A shell you can look inside."
                lede="Brick treats security as published engineering: a written threat model, honest data classification, adversarial testing — and limitations documented in the open instead of hidden behind marketing."
              />
            </Reveal>
            <p id="security-heading" className="sr-only">
              Security philosophy
            </p>

            {/* the protective shell visual */}
            <Reveal delay={0.15} className="mt-12">
              <GlassSurface
                level={4}
                glow
                className="relative aspect-[1.9/1] max-w-md overflow-hidden rounded-2xl"
                aria-hidden
              >
                {/* shell rings */}
                <div className="absolute inset-4 rounded-xl border border-white/18" />
                <div className="absolute inset-10 rounded-lg border border-white/12" />
                {/* the core */}
                <div className="absolute left-1/2 top-1/2 size-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brick-500/80 blur-[2px] shadow-[0_0_40px_rgb(224_85_47/0.5)]" />
                <div className="absolute left-1/2 top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brick-200" />
                {/* boundary labels */}
                <span className="absolute bottom-3 left-4 font-mono text-[0.55rem] uppercase tracking-[0.22em] text-ink-400">
                  network boundary
                </span>
                <span className="absolute right-4 top-3 font-mono text-[0.55rem] uppercase tracking-[0.22em] text-ink-400">
                  secrets stay inside
                </span>
              </GlassSurface>
            </Reveal>
          </div>

          <ul className="grid gap-4 sm:grid-cols-2">
            {SECURITY_PRINCIPLES.map((p, i) => (
              <Reveal key={p.id} delay={0.05 * (i % 2)}>
                <li className="h-full list-none">
                  <GlassSurface
                    level={p.status === "implemented" ? 2 : 1}
                    className={
                      "h-full rounded-xl p-5 " +
                      (p.status !== "implemented" ? "border-dashed" : "")
                    }
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-[0.98rem] font-semibold tracking-tight text-ink-050">
                        {p.title}
                      </h3>
                      <StatusBadge status={p.status} />
                    </div>
                    <p className="mt-2.5 text-[0.85rem] leading-relaxed text-ink-300">
                      {p.body}
                    </p>
                  </GlassSurface>
                </li>
              </Reveal>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
