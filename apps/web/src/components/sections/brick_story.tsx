"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { BrickButtonLink } from "@/components/ui/brick_button";
import { StatusPill } from "@/components/ui/status_pill";
import { WebGLBoundary } from "@/components/three/webgl_boundary";
import { HeroFallback, HeroFallbackMobile } from "./hero_fallback";
import { isWebglAvailable } from "@/lib/quality";
import { REPO_URL } from "@/content/project_facts";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const BrickStoryScene = dynamic(
  () => import("@/components/three/brick_story_scene"),
  { ssr: false },
);

/**
 * Hero presentation mode, decided once on the client:
 *   pending — first paint; renders the static composition, identical to SSR
 *   webgl   — WebGL is available; the scroll story mounts and pins
 *   static  — reduced motion, or no usable WebGL; CSS brick, never pinned
 */
type SceneMode = "pending" | "webgl" | "static";

/**
 * The CSS composition: what the hero shows before the scene mounts, and
 * permanently when WebGL cannot be had. Decorative by design.
 */
function StaticComposition() {
  return (
    <>
      <HeroFallback />
      <HeroFallbackMobile />
    </>
  );
}

const nothing_to_subscribe_to = () => () => {};

const server_scene_mode = (): SceneMode => "pending";

function client_scene_mode(): SceneMode {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  return reduced || !isWebglAvailable() ? "static" : "webgl";
}

/**
 * useSceneMode — the browser's verdict, without ever disagreeing with the
 * server. useSyncExternalStore is React's shape for reading an external
 * system: the server snapshot is the pending (static) composition, so
 * hydration always matches and the client settles the question right after.
 * Neither GPU capability nor the motion preference changes mid-session, so
 * there is genuinely nothing to subscribe to.
 */
function useSceneMode(): SceneMode {
  return useSyncExternalStore(
    nothing_to_subscribe_to,
    client_scene_mode,
    server_scene_mode,
  );
}

/** Story phases shown as copy during the pinned sequence. */
const PHASES = [
  { at: 0.0, label: "Phase 01 · Foundation", title: "A brick." },
  { at: 0.3, label: "Phase 02 · The build begins", title: "It finds its place." },
  { at: 0.6, label: "Phase 03 · Masonry", title: "Walls rise from layers." },
  { at: 0.85, label: "Phase 04 · Structure", title: "Built brick by brick." },
] as const;

/**
 * BrickStory — the cinematic scroll narrative.
 *
 * Structure (per GSAP pinning rules):
 *   <section data-story>        ← outer: provides scroll distance
 *     <div data-story-pin>      ← inner: pinned by ScrollTrigger
 *       <canvas/> + <copy/>
 *
 * The scrubbed timeline maps scroll position → progress objects read by
 * the 3D scene each frame. Nothing plays on enter; scrolling up reverses.
 */
export function BrickStory() {
  const story_ref = useRef<HTMLElement>(null);
  const pin_ref = useRef<HTMLDivElement>(null);
  const story_proxy = useRef(0);
  const build_proxy = useRef(0);
  const canvas_ref = useRef<HTMLDivElement>(null);
  const triggers_ref = useRef<ScrollTrigger[]>([]);
  const [active, set_active] = useState(false);
  const [phase, set_phase] = useState(0);
  const capable_mode = useSceneMode();
  // Set only if the scene proves unrunnable after mount — context budget
  // exhausted, GPU process gone — at which point the boundary has already
  // swapped in the fallback and the section should stop pinning.
  const [scene_failed, set_scene_failed] = useState(false);
  const mode: SceneMode = scene_failed ? "static" : capable_mode;

  // Scroll choreography — only where a canvas will actually run, so a static
  // hero never leaves 3.8 screens of nothing to scroll through.
  useEffect(() => {
    if (mode !== "webgl") return;

    const el = story_ref.current;
    const pin = pin_ref.current;
    if (!el || !pin) return;

    // Lazy-mount WebGL only once the story region is near the viewport.
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          set_active(true);
          io.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    io.observe(el);

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: el,
        start: "top top",
        end: "+=2800",
        scrub: 1,
        pin: pin_ref.current,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
    });

    // Continuous progress mapping — scroll position IS the animation state.
    // Proxies are written by GSAP; the scene reads them per frame.
    tl.to(story_proxy, { current: 1, duration: 0.55, ease: "none" }, 0)
      .to(build_proxy, { current: 1, duration: 0.4, ease: "none" }, 0.45)
      // hold at the end so the wall is contemplated before the next section
      .to({}, { duration: 0.05 });

    // Hero copy hands over to the story: fade + lift as the build begins.
    tl.to("[data-story-copy] > div", { opacity: 0, y: -40, duration: 0.2, ease: "power1.in" }, 0.12);
    const copy_st = ScrollTrigger.create({
      trigger: el,
      start: "top top",
      end: "+=800",
      scrub: true,
      animation: gsap.to("[data-story-copy] > div", { opacity: 0, y: -40, ease: "none" }),
    });
    triggers_ref.current.push(copy_st);

    const triggers: ScrollTrigger[] = [tl.scrollTrigger!];
    PHASES.forEach((p, i) => {
      const st = ScrollTrigger.create({
        trigger: el,
        start: `top+=${p.at * 2800} center`,
        end: `top+=${(PHASES[i + 1]?.at ?? 1.05) * 2800} center`,
        onToggle: (self) => {
          if (self.isActive) set_phase(i);
        },
      });
      triggers.push(st);
    });

    return () => {
      triggers.forEach((t) => t.kill());
      triggers_ref.current.forEach((t) => t.kill());
      triggers_ref.current = [];
      io.disconnect();
    };
  }, [mode]);

  return (
    <section
      ref={story_ref}
      id="story"
      aria-label="Brick story"
      className={mode === "webgl" ? "relative h-[380vh]" : "relative h-screen"}
    >
      <div ref={pin_ref} className="h-screen overflow-hidden">
        {/* spatial scene */}
        <div ref={canvas_ref} className="absolute inset-0" aria-hidden>
          {mode === "webgl" && active ? (
            <WebGLBoundary
              fallback={<StaticComposition />}
              on_error={() => set_scene_failed(true)}
            >
              <BrickStoryScene
                story_ref={story_proxy}
                build_ref={build_proxy}
              />
            </WebGLBoundary>
          ) : (
            <>
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_65%_40%,rgb(180_90_50/0.10),transparent_65%)]" />
              <StaticComposition />
            </>
          )}
        </div>

        {/* hero copy (visible at story start, fades with progress) */}
        <div className="absolute inset-0 z-10 pointer-events-none">
          <div
            data-story-copy
            className="absolute inset-x-0 top-[22vh] mx-auto max-w-[var(--content-width)] px-6 sm:px-8"
          >
            <div className="max-w-xl">
              <StatusPill
                label="Open source · Privacy first"
                className="mb-7 glass-lens"
              />
              <h1
                id="hero-heading"
                className="text-balance text-[2.7rem] font-semibold leading-[1.03] tracking-[-0.035em] text-ink-050 sm:text-7xl lg:text-[5rem]"
              >
                Privacy, built
                <br />
                brick by brick.
              </h1>
              <p className="mt-6 max-w-md text-pretty text-lg leading-relaxed text-ink-200">
                Brick is a free, open-source VPN client engineered around
                privacy, performance, and transparent development.
              </p>
              <div className="pointer-events-auto mt-9 flex flex-wrap items-center gap-4">
                <BrickButtonLink
                  href={REPO_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  size="lg"
                  className="glass-lens"
                >
                  Follow the build
                  <span aria-hidden>→</span>
                </BrickButtonLink>
                <BrickButtonLink
                  href="#what-is-brick"
                  variant="secondary"
                  size="lg"
                  className="glass-lens"
                >
                  Explore Brick
                </BrickButtonLink>
              </div>
            </div>
          </div>
        </div>

        {/* phase copy during scroll */}
        <div className="absolute bottom-[14vh] left-1/2 z-10 w-full max-w-md -translate-x-1/2 px-6 text-center sm:px-0">
          {PHASES.map((p, i) => (
            <p
              key={p.label}
              aria-hidden={phase !== i}
              className={
                "absolute inset-x-6 bottom-0 transition-all duration-500 sm:inset-x-0 " +
                (phase === i
                  ? "translate-y-0 opacity-100"
                  : "translate-y-2 opacity-0")
              }
            >
              <span className="font-mono text-[0.62rem] uppercase tracking-[0.3em] text-brick-300">
                {p.label}
              </span>
              <span className="mt-2 block text-xl font-medium tracking-tight text-ink-100 sm:text-2xl">
                {p.title}
              </span>
            </p>
          ))}
          {/* keep container height stable */}
          <span className="invisible block text-xl">Placeholder</span>
        </div>

        {/* scroll hint at start */}
        <div
          aria-hidden
          className="absolute bottom-7 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-2 lg:flex"
        >
          <span className="font-mono text-[0.6rem] uppercase tracking-[0.3em] text-ink-400">
            Scroll
          </span>
          <div className="h-8 w-px bg-gradient-to-b from-white/50 to-transparent" />
        </div>
      </div>

      {/* screen-reader summary of the visual story */}
      <p className="sr-only">
        The story of Brick, told in four phases: a single brick as the
        foundation; the brick opening to reveal its layers; layers becoming
        systems — configuration, protocols, engine, security; and a wall of
        bricks assembling — the project built brick by brick in the open.
      </p>
    </section>
  );
}
