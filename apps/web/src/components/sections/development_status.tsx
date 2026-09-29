import { GlassSurface } from "@/components/ui/glass_surface";
import { SectionHeading } from "@/components/ui/section_heading";
import { StatusBadge } from "@/components/ui/status_badge";
import { BrickStageTile } from "@/components/ui/brick_stage_tile";
import { Reveal } from "@/components/animation/reveal";
import { BUILD_STAGES } from "@/content/project_facts";

/**
 * §04 Development status — a construction sequence of identical bricks.
 * The tile shape never changes between stages; only the material state
 * (solid / lit / ghosted) tells the story. No progress bars, no dates,
 * no percentages.
 */
export function DevelopmentStatus() {
  return (
    <section
      id="development"
      aria-labelledby="development-heading"
      className="relative border-t border-white/5"
    >
      <div className="mx-auto max-w-[var(--content-width)] px-6 py-24 sm:px-8 lg:py-32">
        <Reveal>
          <SectionHeading
            eyebrow="Current development"
            title="The build, laid brick by brick."
            lede="Every stage is a brick in the same masonry system. Solid bricks are laid; the lit brick is being laid now; ghosted bricks wait. States come from the project's verified engineering files — never dates, never percentages."
          />
        </Reveal>
        <p id="development-heading" className="sr-only">
          Development status
        </p>

        <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {BUILD_STAGES.map((stage, i) => (
            <Reveal key={stage.id} delay={0.05 * (i % 3)}>
              <li className="h-full list-none">
                <GlassSurface
                  level={2}
                  className={
                    "h-full rounded-2xl p-6 " +
                    (stage.status === "planned" ? "opacity-80" : "")
                  }
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-mono text-[0.6rem] uppercase tracking-[0.24em] text-ink-400">
                      brick {String(i + 1).padStart(2, "0")}
                    </span>
                    <StatusBadge status={stage.status} />
                  </div>

                  <BrickStageTile
                    status={stage.status}
                    fill={stage.fill}
                    className="mt-5"
                  />

                  <h3 className="mt-5 text-lg font-semibold tracking-tight text-ink-050">
                    {stage.label}
                  </h3>
                  <p className="mt-2 text-[0.86rem] leading-relaxed text-ink-300">
                    {stage.detail}
                  </p>
                </GlassSurface>
              </li>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
