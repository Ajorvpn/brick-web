"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { BrickButtonLink } from "@/components/ui/brick_button";
import { StatusPill } from "@/components/ui/status_pill";
import { WebGLBoundary } from "@/components/three/webgl_boundary";
import { Reveal } from "@/components/animation/reveal";
import { isWebglAvailable } from "@/lib/quality";
import { REPO_URL } from "@/content/project_facts";
import { smoothstep, story_progress } from "@/components/three/story_progress";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const BrickStoryScene = dynamic(
  () => import("@/components/three/brick_story_scene"),
  { ssr: false },
);

/**
 * Hero presentation mode, decided once on the client:
 *   pending — first paint; poster only, identical to SSR
 *   webgl   — WebGL is available; the fixed scene mounts and scrubs
 *   static  — reduced motion, or no usable WebGL; poster, never scrubbed
 */
type SceneMode = "pending" | "webgl" | "static";

const nothing_to_subscribe_to = () => () => {};
const server_scene_mode = (): SceneMode => "pending";

function client_scene_mode(): SceneMode {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  return reduced || !isWebglAvailable() ? "static" : "webgl";
}

/** Reads the browser's verdict without ever disagreeing with the server. */
function useSceneMode(): SceneMode {
  return useSyncExternalStore(
    nothing_to_subscribe_to,
    client_scene_mode,
    server_scene_mode,
  );
}

/**
 * The four captions. Text, not canvas: they must survive reduced motion,
 * screen readers and a dead GPU.
 */
const CAPTIONS = [
  { phase: "Phase 01 · Foundation", line: "One brick." },
  { phase: "Phase 02 · The laying", line: "It finds its place." },
  { phase: "Phase 03 · The wall", line: "Every stage, a stamped brick." },
  { phase: "Phase 04 · The structure", line: "Built in the open." },
] as const;

/** Each caption owns a window of the master timeline. */
const CAPTION_WINDOWS: [number, number][] = [
  [0.1, 0.34],
  [0.34, 0.53],
  [0.53, 0.72],
  [0.72, 0.9],
];

const DESKTOP_SCREENS = 4.8;
const MOBILE_SCREENS = 4.2;

declare global {
  interface Window {
    __brick?: {
      setProgress: (p: number) => void;
      getProgress: () => number;
    };
  }
}

/**
 * BrickStory — the whole scroll narrative, and the wall's life after it.
 *
 * One canvas, `position: fixed`, mounted once for the entire page: there is
 * no pin-to-unpin swap, so there is nothing that can jump. The section below
 * only supplies scroll distance; a single scrubbed tween writes progress into
 * `story_progress`, the scene reads it per frame, and the CSS recession is
 * applied to the canvas wrapper by the same update — cheap, and identical on
 * every engine.
 *
 * Beats (see story_progress for the numbers):
 *   0.00–0.10  hero copy hands over; the keystone idles
 *   0.08–0.30  descent: 35° of yaw turns to face-on, camera dollies in
 *   0.30–0.46  the lay: ghost socket, alignment, a mason's press
 *   0.45       impact: dust, a gold flare, a teal ring through the joints
 *   0.46–0.66  reveal: the camera pulls back, the frieze lights left to right
 *   0.66–0.88  recession: the scene becomes a blurred, rounded card
 *   0.88–1.00  release: the wall settles into a permanent backdrop
 */
export function BrickStory() {
  const section_ref = useRef<HTMLElement>(null);
  const frame_ref = useRef<HTMLDivElement>(null);
  const copy_ref = useRef<HTMLDivElement>(null);
  const caption_refs = useRef<(HTMLDivElement | null)[]>([]);
  const capable_mode = useSceneMode();
  const poster_ref = useRef<HTMLImageElement>(null);

  // One attribute, so a support engineer (or a headless run) can see which
  // presentation the browser chose without opening DevTools.
  useEffect(() => {
    document.documentElement.dataset.brickStory = capable_mode;
  }, [capable_mode]);
  const [active, set_active] = useState(false);
  const [scene_failed, set_scene_failed] = useState(false);
  const mode: SceneMode = scene_failed ? "static" : capable_mode;

  // --- the frame is written directly; React never re-renders per scroll ---
  useEffect(() => {
    const frame = frame_ref.current;
    if (!frame) return;
    const last = { drift: 0, p: -1 };

    const write_frame = (p: number) => {
      const recede = smoothstep(0.66, 0.88, p);
      const release = smoothstep(0.885, 0.99, p);
      const drift = release > 0 ? last.drift : 0;
      frame.style.transform =
        recede > 0.001 || drift > 0.5
          ? `translate3d(0, ${-4 * recede}vh, 0) scale(${1 - 0.1 * recede})` +
            ` translateY(${drift}px)`
          : "none";
      frame.style.borderRadius = recede > 0.001 ? `${recede * 36}px` : "0px";
      // An identity filter still forces a full-screen offscreen composite on
      // every engine, so it is cleared rather than left at blur(0): the scene
      // costs nothing extra until the recession actually starts.
      frame.style.filter =
        recede > 0.001 || release > 0.001
          ? `blur(${12 * recede + 6 * release}px) ` +
            `brightness(${1 - 0.4 * recede - 0.06 * release}) ` +
            `saturate(${1 - 0.2 * recede})`
          : "none";
      frame.style.opacity = String(1 - 0.58 * release);
    };

    const apply = (p: number) => {
      last.p = p;
      write_frame(p);

      // hero copy hands over, scrubbed
      const copy = copy_ref.current;
      if (copy) {
        const k = smoothstep(0, 0.15, p);
        copy.style.opacity = String(1 - k);
        copy.style.transform = `translate3d(0, ${-40 * k}px, 0)`;
        copy.style.filter = `blur(${8 * k}px)`;
        copy.style.pointerEvents = k > 0.5 ? "none" : "";
        copy.style.visibility = k > 0.98 ? "hidden" : "visible";
      }

      // captions
      caption_refs.current.forEach((el, i) => {
        const w = CAPTION_WINDOWS[i];
        if (!el || !w) return;
        const v =
          smoothstep(w[0] - 0.035, w[0], p) * (1 - smoothstep(w[1], w[1] + 0.035, p));
        el.style.opacity = String(v);
        el.style.transform = `translateY(${(1 - v) * 10}px)`;
        el.style.visibility = v < 0.01 ? "hidden" : "visible";
      });

      // the sheet: normal flow does most of the work, the transform makes it
      // deliberate. Both are pure functions of p, so reverse is exact.
      const sheet = document.querySelector<HTMLElement>("[data-brick-sheet]");
      if (sheet) {
        const lift = 1 - smoothstep(0.66, 0.88, p);
        sheet.style.transform = `translate3d(0, ${lift * window.innerHeight * 0.9}px, 0)`;
      }
    };

    apply(0);

    if (mode !== "webgl") return;

    const section = section_ref.current;
    if (!section) return;

    // scroll distance: ~480vh desktop, ~420vh mobile, in px so the sheet's
    // transform maths has something exact to work with
    const size = () => {
      const h = window.innerHeight * (window.innerWidth < 768 ? MOBILE_SCREENS : DESKTOP_SCREENS);
      section.style.height = `${h}px`;
    };
    size();

    // the sheet overlaps the story's tail; in static mode it must not
    const sheet = document.querySelector<HTMLElement>("[data-brick-sheet]");
    if (sheet) sheet.style.marginTop = "-52vh";

    const proxy = { p: 0 };
    const tween = gsap.to(proxy, {
      p: 1,
      duration: 1,
      ease: "none",
      onUpdate: () => {
        story_progress.p = proxy.p;
        apply(proxy.p);
      },
    });

    const trigger = ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: () => `+=${section.offsetHeight}`,
      scrub: true, // Lenis already smooths; adding scrub: 1 would mush it
      animation: tween,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        story_progress.p = self.progress;
      },
    });

    // lazy-mount the canvas when the story approaches the viewport
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          set_active(true);
          io.disconnect();
        }
      },
      { rootMargin: "300px" },
    );
    io.observe(section);

    // after release, the wall drifts at 0.04x — a background, not a scene
    let raf = 0;
    const on_scroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        if (story_progress.p < 0.995) return;
        const end = section.offsetTop + section.offsetHeight;
        const d = Math.max(0, window.scrollY - end + window.innerHeight) * 0.04;
        if (Math.abs(d - last.drift) < 0.4) return;
        last.drift = d;
        write_frame(1);
      });
    };
    window.addEventListener("scroll", on_scroll, { passive: true });

    const on_resize = () => {
      size();
      ScrollTrigger.refresh();
    };
    window.addEventListener("resize", on_resize);

    // debug hook: drive the master timeline without scrolling, so frames at
    // exact progress values are reproducible
    const debug_enabled =
      process.env.NODE_ENV !== "production" ||
      new URLSearchParams(window.location.search).get("debug") === "1";
    if (debug_enabled) {
      window.__brick = {
        setProgress: (p: number) => {
          const clamped = Math.min(1, Math.max(0, p));
          trigger.disable(false);
          story_progress.p = clamped;
          tween.progress(clamped, true);
          apply(clamped);
        },
        getProgress: () => story_progress.p,
      };
    }

    requestAnimationFrame(() => ScrollTrigger.refresh());

    return () => {
      io.disconnect();
      window.removeEventListener("scroll", on_scroll);
      window.removeEventListener("resize", on_resize);
      if (raf) cancelAnimationFrame(raf);
      trigger.kill();
      tween.kill();
      if (sheet) sheet.style.marginTop = "";
      if (debug_enabled) delete window.__brick;
    };
  }, [mode]);

  const webgl = mode === "webgl";

  return (
    <>
      {/* the persistent scene layer — fixed for the whole page, never pinned */}
      <div
        ref={frame_ref}
        data-brick-frame
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      >
        {/* the poster paints instantly: no layout shift, no empty frame */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={poster_ref}
          src={webgl ? "/bricks/poster-hero.webp" : "/bricks/poster-wall.webp"}
          alt=""
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700"
          style={{ opacity: 1 }}
          fetchPriority="high"
        />

        {webgl && active && (
          <WebGLBoundary
            fallback={null}
            on_error={() => set_scene_failed(true)}
          >
            <BrickStoryScene
              on_ready={() => {
                // paint, not React state: the story subtree must not re-render
                if (poster_ref.current) poster_ref.current.style.opacity = "0";
              }}
            />
          </WebGLBoundary>
        )}

        {/* post, in CSS where a CSS filter belongs: a whisper of vignette
            and film grain, off entirely for reduced motion */}
        <div className="brick-vignette" />
        <div className="brick-grain" />
      </div>

      {/* scroll distance for the choreography, and the text on top of it */}
      <section
        ref={section_ref}
        id="story"
        aria-label="Brick story"
        className={webgl ? "relative z-10" : "relative z-10 h-screen"}
      >
        <div className="sticky top-0 h-screen overflow-hidden">
          {/* hero copy — hands over to the story as the keystone descends */}
          <div
            ref={copy_ref}
            data-story-copy
            className="absolute inset-x-0 top-[20vh] mx-auto max-w-[var(--content-width)] px-6 will-change-transform sm:px-8"
          >
            <div className="max-w-xl pointer-events-auto">
              <Reveal y={18}>
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
              </Reveal>
              <Reveal y={16} delay={0.12}>
                <p className="mt-6 max-w-md text-pretty text-lg leading-relaxed text-ink-200">
                  Brick is a free, open-source VPN client engineered around
                  privacy, performance, and transparent development.
                </p>
              </Reveal>
              <Reveal y={14} delay={0.24}>
                <div className="mt-9 flex flex-wrap items-center gap-4">
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
              </Reveal>
            </div>
          </div>

          {/* captions: glass chips, bottom centre */}
          <div className="absolute inset-x-0 bottom-[9vh] z-20 flex justify-center px-6">
            <div className="relative h-16 w-full max-w-md">
              {CAPTIONS.map((caption, i) => (
                <div
                  key={caption.phase}
                  ref={(el) => {
                    caption_refs.current[i] = el;
                  }}
                  className="glass glass-2 absolute inset-x-0 bottom-0 mx-auto w-fit rounded-full px-5 py-3 text-center"
                  style={{
                    opacity: mode === "webgl" ? 0 : i === 3 ? 1 : 0,
                    visibility: mode === "webgl" || i === 3 ? "visible" : "hidden",
                  }}
                >
                  <span className="block font-mono text-[0.58rem] uppercase tracking-[0.28em] text-brick-300">
                    {caption.phase}
                  </span>
                  <span className="mt-1 block text-[0.95rem] font-medium tracking-tight text-ink-100">
                    {caption.line}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* scroll hint */}
          <div
            aria-hidden
            className="absolute bottom-7 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-2 lg:flex"
            style={{ opacity: mode === "webgl" ? 1 : 0 }}
          >
            <span className="font-mono text-[0.6rem] uppercase tracking-[0.3em] text-ink-400">
              Scroll
            </span>
            <div className="h-8 w-px bg-gradient-to-b from-white/50 to-transparent" />
          </div>
        </div>
      </section>

      {/* screen-reader summary of the visual story */}
      <p className="sr-only">
        The story of Brick: one keystone brick travels down into the crown of a
        half-metre-thick Persian brick wall — stamped bricks, a glazed frieze —
        and is laid flush. Every stage of the project is one stamped brick in
        that wall. The wall then recedes behind the page as a quiet backdrop.
      </p>
    </>
  );
}

