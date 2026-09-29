import { GlassSurface } from "@/components/ui/glass_surface";
import { SectionHeading } from "@/components/ui/section_heading";
import { Reveal } from "@/components/animation/reveal";
import { WHY_BRICK_PRINCIPLES, type why_brick_principle } from "@/content/project_facts";

/** Distinct visual identity per principle — no identical cards. */
function principle_visual(visual: why_brick_principle["visual"]) {
  switch (visual) {
    case "lens":
      return (
        <div aria-hidden className="relative h-20 overflow-hidden rounded-xl">
          <div className="absolute inset-0 bg-[conic-gradient(from_140deg_at_30%_120%,rgb(224_85_47/0.35),transparent_40%,rgb(88_200_221/0.25)_70%,transparent)]" />
          <div className="absolute left-1/2 top-1/2 size-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/25 bg-white/5 backdrop-blur-[2px] [box-shadow:inset_0_1px_0_rgb(255_255_255/0.25),0_8px_24px_-8px_rgb(0_0_0/0.5)]" />
        </div>
      );
    case "open":
      return (
        <div aria-hidden className="relative h-20 rounded-xl border border-dashed border-white/20 p-3">
          <div className="flex h-full items-end gap-2">
            {[38, 60, 46, 72, 30].map((w, i) => (
              <div
                key={i}
                className="rounded-t bg-gradient-to-t from-brick-500/40 to-brick-300/25"
                style={{ width: `${w * 0.18}rem`, height: `${w}%` }}
              />
            ))}
          </div>
          <span className="absolute right-3 top-2.5 font-mono text-[0.55rem] uppercase tracking-[0.2em] text-ink-400">
            no gates
          </span>
        </div>
      );
    case "layers":
      return (
        <div aria-hidden className="relative h-20 rounded-xl">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="absolute inset-x-4 rounded-lg border border-white/18 bg-white/6"
              style={{
                top: `${8 + i * 22}%`,
                height: "40%",
                transform: `translateX(${i * 10}px)`,
                zIndex: 3 - i,
              }}
            />
          ))}
        </div>
      );
    case "flow":
      return (
        <div aria-hidden className="relative h-20 overflow-hidden rounded-xl">
          <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-cyan-glow/60 to-transparent" />
          <div className="absolute left-[18%] top-1/2 size-1.5 -translate-y-1/2 rounded-full bg-cyan-glow/90 shadow-[0_0_10px_rgb(88_200_221/0.8)]" />
          <div className="absolute left-[46%] top-1/2 size-1 -translate-y-1/2 rounded-full bg-brick-300/90 shadow-[0_0_8px_rgb(224_85_47/0.7)]" />
          <div className="absolute left-[74%] top-1/2 size-1.5 -translate-y-1/2 rounded-full bg-cyan-glow/70 shadow-[0_0_10px_rgb(88_200_221/0.6)]" />
        </div>
      );
  }
}

/** §03 Why Brick — four principles, each with its own visual identity. */
export function WhyBrick() {
  return (
    <section
      id="why-brick"
      aria-labelledby="why-heading"
      className="relative border-t border-white/5 bg-ink-900/40"
    >
      <div className="mx-auto max-w-[var(--content-width)] px-6 py-28 sm:px-8 lg:py-36">
        <Reveal>
          <SectionHeading
            eyebrow="Why Brick"
            title="Four commitments, engineered into the foundation."
            align="center"
          />
        </Reveal>
        <p id="why-heading" className="sr-only">
          Why Brick
        </p>

        <div className="mt-16 grid gap-5 md:grid-cols-2">
          {WHY_BRICK_PRINCIPLES.map((p, i) => (
            <Reveal key={p.id} delay={0.06 * i}>
              <GlassSurface
                level={2}
                className="h-full rounded-2xl p-7 sm:p-8"
                data-why={p.visual}
              >
                {principle_visual(p.visual)}
                <h3 className="mt-7 text-xl font-semibold tracking-tight text-ink-050">
                  {p.title}
                </h3>
                <p className="mt-3 text-[0.94rem] leading-relaxed text-ink-300">
                  {p.body}
                </p>
              </GlassSurface>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
