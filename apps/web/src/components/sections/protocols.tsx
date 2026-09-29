import { GlassSurface } from "@/components/ui/glass_surface";
import { SectionHeading } from "@/components/ui/section_heading";
import { StatusBadge } from "@/components/ui/status_badge";
import { Reveal } from "@/components/animation/reveal";
import { PROTOCOL_MODULES } from "@/content/project_facts";

/**
 * §06 Protocol layer — six modules of an engineered system, feeding a
 * central engine. Status is stated honestly: parser-level implemented;
 * runtime arrives with the native engine.
 */
export function Protocols() {
  return (
    <section
      id="protocols"
      aria-labelledby="protocols-heading"
      className="relative border-t border-white/5"
    >
      <div className="mx-auto max-w-[var(--content-width)] px-6 py-28 sm:px-8 lg:py-36">
        <Reveal>
          <SectionHeading
            eyebrow="Configuration & protocols"
            title="Speak the networks people actually use."
            lede="Brick's configuration engine already parses all six protocol families — from links, QR codes, subscriptions or raw config — and compiles them into a validated runtime model. Parser-level implemented today; runtime support lands with the native engine."
          />
        </Reveal>
        <p id="protocols-heading" className="sr-only">
          Protocols
        </p>

        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PROTOCOL_MODULES.map((p, i) => (
            <Reveal key={p.id} delay={0.05 * (i % 3)}>
              <GlassSurface
                level={2}
                className="group h-full rounded-2xl p-6"
              >
                <div className="flex items-start justify-between gap-3">
                  {/* module glyph — distinct geometry per family */}
                  <div
                    aria-hidden
                    className={
                      "flex size-11 items-center justify-center rounded-lg border " +
                      (p.family === "QUIC-based"
                        ? "border-cyan-glow/30 bg-cyan-glow/10"
                        : p.family === "TCP-based"
                          ? "border-brick-300/30 bg-brick-400/10"
                          : "border-violet-glow/30 bg-violet-glow/10")
                    }
                  >
                    <span
                      className={
                        "block rounded-[3px] " +
                        (p.family === "QUIC-based"
                          ? "size-3.5 rounded-full border-2 border-cyan-glow/80"
                          : p.family === "TCP-based"
                            ? "size-3.5 bg-brick-400/90"
                            : "size-3.5 rotate-45 border-2 border-violet-glow/80")
                      }
                    />
                  </div>
                  <StatusBadge status={p.status} />
                </div>

                <h3 className="mt-5 font-mono text-lg font-semibold tracking-tight text-ink-050">
                  {p.name}
                </h3>
                <p className="mt-1 font-mono text-[0.62rem] uppercase tracking-[0.2em] text-ink-400">
                  {p.family}
                </p>
                <p className="mt-3 text-[0.88rem] leading-relaxed text-ink-300">
                  {p.note}
                </p>
              </GlassSurface>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.1}>
          <p className="mt-8 text-center text-[0.8rem] text-ink-400">
            Parser-level status. Runtime connectivity depends on the native
            engine — tracked in the{" "}
            <a
              className="text-ink-200 underline decoration-brick-500/60 underline-offset-4 hover:text-ink-050"
              href="#development"
            >
              development status
            </a>
            .
          </p>
        </Reveal>
      </div>
    </section>
  );
}
