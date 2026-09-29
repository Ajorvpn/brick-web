# brick-web — Implementation Plan (Phase 0 deliverable)

> Source of truth for product facts: the Brick VPN Flutter/Dart repository
> (`../brick-vpn`), especially `AI_ROLES/PROJECT_STATE.md` (verified 2026-09-28).
> The website **never** claims more than that document proves.

---

## 1. Verified product facts (what the site may say)

From `PROJECT_STATE.md` / `ROADMAP.md` / `ARCHITECTURE.md` / `SECURITY.md`:

- Brick is a **free, open-source, Android-first, privacy-focused VPN client**
  built with Flutter + Dart, licensed **GPL v3**.
- Status: **Phase 3 — Android VPN Engine (Gate A: native harness) in progress.**
  A native-only Kotlin harness builds a real 3.2 MB debug APK (`gradlew assembleDebug` proven).
- **Phase 0 (governance) and Phase 1 (architecture skeleton) complete.**
- **Phase 2 (config parser) substantially complete**: 8 protocol families parsed
  (VLESS, VMess, Trojan, Shadowsocks, Hysteria2, TUIC + WireGuard / AmneziaWG),
  subscription decoder/fetcher, smart content router, Sing-Box serializer.
  575 tests pass monorepo-wide (551 pure-Dart + 24 Flutter), `flutter analyze` clean.
- Planned core: **sing-box via libbox** (integrate, not reimplement).
- **No telemetry / analytics by design.** Logging silences itself in release builds.
- Security-first engineering: untrusted-input parsing, fuzz/adversarial pass found and
  fixed 2 real bugs, bounded defensive decoders, no secret echo in errors, secret-safe
  design, dependency verification, signed release intent.
- Repo: `https://github.com/Ajorvpn/brick`
- What does NOT exist: iOS/desktop support, Play Store release, public stable release,
  real VPN traffic, device-run acceptance. The site must not imply any of these.

**Language rules on the site:** "Development Preview", "In active development",
"Built in public", "Now / Next / Later" roadmap (no dates, no percentages presented as
completion truth — a stylised progress metaphor is allowed but labelled as such).

## 2. Stack (verified compatible, deliberately minimal)

| Concern | Choice | Why |
|---|---|---|
| Framework | Next.js 16.3.x, App Router, React 19.2.x | current stable line as of 2026-09; Turbopack default |
| Language | TypeScript strict | — |
| Styling | Tailwind CSS 4.1.x | CSS-first config via `@theme` |
| Primitives | shadcn/ui (Radix-based) | accessible primitives, fully re-skinned |
| Animation | Motion (`motion` package) + GSAP 3.13 + ScrollTrigger | local vs. scrubbed timelines |
| Smooth scroll | Lenis (`lenis`) | optional, desktop-enhancement only |
| 3D | Three 0.18x, R3F 9.x, drei 10.x | verified mutually compatible majors |
| Monorepo | Turborepo 2.x + pnpm 10.x | — |
| Tests | Vitest + RTL; Playwright smoke (browser-permitting) | — |
| Fonts | next/font (Geist + Geist Mono), self-hosted | zero layout shift, no external requests |

Rejected: Spline/Rive/Theatre.js (no scene justifies runtime cost), `@liquidglass/react`
(experimental, unverified a11y/i18n surface; we implement a custom, auditable glass system
instead), any analytics.

## 3. Architecture

```
brick-web/
├── apps/web/                     # Next.js app (the site)
│   ├── src/app/                  # App Router
│   ├── src/components/ui/        # Design-system components (glass system)
│   ├── src/components/sections/  # Page sections
│   ├── src/components/three/     # R3F scenes (lazy, device-aware)
│   ├── src/components/animation/ # Reveal, Parallax, quality manager
│   ├── src/content/              # Verified product facts as typed data
│   └── src/lib/                  # hooks + utils
├── packages/                     # (kept minimal; single-app monorepo)
│   ├── config/                   # shared tsconfig / eslint / tailwind config
│   └── typescript-config/        # base tsconfigs
└── docs/                         # plan + reports
```

Packages stay minimal: this is a single-site project; over-splitting into
`ui/`/`three/`/`liquid-glass/` packages with one consumer would be ceremony.

## 4. Design system

- **Tokens** (`globals.css` + `tailwind.theme.css`): near-black `--color-ink-*` scale,
  graphite surfaces, warm brick accent ramp (`#e0552f` core), cool cyan + muted violet
  atmosphere, glass levels 0–5, radii, easing, durations, z-layers, content widths.
- **Type**: Geist Sans (display+body) + Geist Mono (technical labels, numbers).
- **Material system**: `GlassSurface` (5 levels × tint variants) built from layered
  background gradients, saturate+blur backdrop-filter, inset specular rim, noise overlay;
  `GlassCard` (interactive + tilt), `GlassButton`, `StatusPill`, `ProgressBrick`.
  SVG-filter displacement refraction reserved for hero-adjacent hero panels only;
  every effect has a static fallback (single `@supports` query + quality manager).

## 5. 3D architecture

- `GlassBrick`: RoundedBox bevelled brick, MeshPhysicalMaterial (transmission, IOR 1.5,
  thickness, dispersion), inner emissive core mesh + wireframe layer lines, floating
  node-particles with additive glow, `Environment` lighting.
- Quality manager (`quality.ts`): LOW/MEDIUM/HIGH from
  `prefers-reduced-motion`, device memory/hardwareConcurrency, DPR clamp, pointer type.
- Scene: `BrickHeroScene` — lazy-mounted client component, `frameloop` pauses when
  document hidden; scroll-linked via GSAP ScrollTrigger driving scene state (no per-frame
  React state). Mobile: reduced particle count, narrower camera, no refraction-heavy
  settings, tilt-only idle motion.

## 6. Motion architecture

- Motion: entrances, stagger, hover/tap, layout — local components only.
- GSAP + ScrollTrigger: hero scroll transformation, section choreography, pinned story.
- Lenis: desktop, enabled only when `prefers-reduced-motion` is off; skips coarse pointers.
- All decorative motion disabled under reduced motion; opacity-only reveals remain.

## 7. Content architecture (single page, anchor nav)

Header · Hero · Development Status (brick stack timeline) · Why Brick (6 cards) ·
Privacy (principles) · Architecture (layered stack diagram) · Protocols (6 glass bricks) ·
Performance (tunnel visual + engineering philosophy) · Roadmap (Now/Next/Later) ·
Open Source (build-in-public + repo CTA) · Final CTA · Footer.

Every factual line is sourced from `src/content/facts.ts` with a `source` field
documenting which repo doc backs it.

## 8. Testing strategy

- **Vitest + RTL**: smoke (renders page), nav (anchors + scroll), CTA links correct
  (`Ajorvpn/brick`), reduced-motion class applied, no component crashes on jsdom.
- **Playwright** (if browsers installable): smoke, mobile nav, no-horizontal-overflow at
  375/768/1440, section visibility, reduced-motion emulation.
- **Per-phase gates**: `pnpm lint && pnpm typecheck && pnpm test && pnpm build` green
  before next phase.

## 9. Responsive strategy

Breakpoints 375 → 1920+, mobile-first. Every section defines its own mobile composition
(not a desktop squeeze): hero uses a vertical 3D composition with reduced effects on
coarse pointers, nav becomes a glass sheet, feature grid becomes snap columns,
architecture stack becomes a vertical list, protocol orbit becomes a snap carousel.

## 10. Accessibility

Semantic landmarks, skip link, visible focus (`:focus-visible`), keyboard-complete nav,
WCAG-AA contrast on all text (accent text darkened on light glass), `prefers-reduced-motion`
respected in CSS + JS, `aria-label`s on icon-only buttons, alt text, no hover-only info.

## 11. Performance

Static generation (no server runtime), RSC-first (only interactive islands hydrate),
3D lazy-loaded below-the-line via dynamic import + IntersectionObserver, DPR clamp ≤ 2,
particle counts scaled by device tier, no web fonts beyond Geist (self-hosted variable),
images: inline SVG only (no raster images planned), zero third-party scripts, no analytics.

## 12. Deployment

Static export-friendly (no server actions/runtime APIs). `next build` output deployable to
Vercel/Netlify/Cloudflare/GitHub Pages (with images unoptimized flag if static export).
No canonical URL hardcoded beyond the repo; metadata uses relative canonical fallback.

## 13. Risks

- WebGL availability in QA environment → 3D degrades to CSS fallback (tested).
- jsdom lacks WebGL/IntersectionObserver → mocked in tests.
- Node 18 system runtime → project-local Node 24 LTS documented in README.
