import { GlassSurface } from "@/components/ui/glass_surface";
import { SectionHeading } from "@/components/ui/section_heading";
import { Reveal } from "@/components/animation/reveal";
import { ROADMAP_ITEMS, type roadmap_item } from "@/content/project_facts";

const when_accent: Record<roadmap_item["when"], string> = {
  Now: "text-brick-300",
  Next: "text-cyan-glow",
  Later: "text-violet-glow",
};

/** §09 Roadmap — Now / Next / Later. No dates, no percentages. */
export function Roadmap() {
  return (
    <section
      id="roadmap"
      aria-labelledby="roadmap-heading"
      className="relative border-t border-white/5 bg-ink-900/40"
    >
      <div className="mx-auto max-w-[var(--content-width)] px-6 py-28 sm:px-8 lg:py-36">
        <Reveal>
          <SectionHeading
            eyebrow="Roadmap"
            title="Where the build goes next."
            lede="Sequenced by engineering reality, not by dates. The project's governance docs define each phase precisely; this is the honest summary."
          />
        </Reveal>
        <p id="roadmap-heading" className="sr-only">
          Roadmap
        </p>

        <div className="mt-16 grid gap-5 lg:grid-cols-3">
          {ROADMAP_ITEMS.map((item, i) => (
            <Reveal key={item.id} delay={0.08 * i}>
              <GlassSurface
                level={i === 0 ? 3 : 2}
                glow={i === 0}
                className="h-full rounded-2xl p-7"
              >
                <p
                  className={`font-mono text-[0.68rem] font-semibold uppercase tracking-[0.26em] ${when_accent[item.when]}`}
                >
                  {item.when}
                </p>
                <h3 className="mt-4 text-xl font-semibold tracking-tight text-ink-050">
                  {item.title}
                </h3>
                <p className="mt-3 text-[0.9rem] leading-relaxed text-ink-300">
                  {item.body}
                </p>
              </GlassSurface>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
