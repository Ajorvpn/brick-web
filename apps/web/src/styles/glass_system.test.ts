import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Guards the exact regression that made the deployed site look flat.
 *
 * v2 referenced `.glass`, `.glass-0`…`.glass-5` and `.glass-glow` from
 * components (and from its own fallback rules) without ever defining them, so
 * every panel rendered as an untinted, unbordered, unblurred rectangle. These
 * assertions are deliberately about the *text* of the stylesheet: they check
 * the contract between the CSS and the components that consume it.
 *
 * Paths are resolved from the package root (the vitest cwd) rather than
 * `import.meta.url`, which is not a file: URL under the jsdom environment.
 */
const read = (rel: string) => readFileSync(resolve(process.cwd(), rel), "utf8");

const css = read("src/styles/glass_material.css");
const aurora = read("src/styles/aurora.css");
const surface = read("src/components/ui/glass_surface.tsx");
const provider = read("src/components/ui/glass_lens_provider.tsx");

/** Every class <GlassSurface> can emit. */
const EMITTED = [
  "glass",
  "glass-0",
  "glass-1",
  "glass-2",
  "glass-3",
  "glass-4",
  "glass-5",
  "glass-glow",
];

const defines = (name: string) =>
  new RegExp(`\\.${name}\\s*[,{:]`).test(css);

describe("glass material contract", () => {
  it("defines the base material and every level class it emits", () => {
    for (const name of EMITTED) {
      expect(defines(name), `.${name} is emitted but never defined`).toBe(true);
    }
  });

  it("emits only classes the stylesheet defines", () => {
    for (const name of EMITTED) {
      // the emitter and the stylesheet must agree in both directions
      expect(surface).toContain(name);
    }
  });

  it("blurs the backdrop, prefixed and unprefixed", () => {
    expect(css).toMatch(/backdrop-filter:\s*blur\(/);
    expect(css).toMatch(/-webkit-backdrop-filter:\s*blur\(/);
  });

  it("gates real refraction behind the runtime capability flag", () => {
    expect(css).toContain('[data-glass-lens="on"]');
    expect(css).toContain("url(#glass-distortion)");
    // both filters the provider defines are actually used by the material —
    // an unreferenced filter is dead weight
    expect(css).toContain("url(#glass-distortion-soft)");
    expect(provider).toContain('id="glass-distortion-soft"');
    // the -webkit- fallback must never carry the SVG reference: Safari's
    // support for it is unreliable, and a dropped declaration there would
    // remove the blur entirely
    expect(css).not.toMatch(/-webkit-backdrop-filter:[^;]*url\(/);
    // and the flag must exist on both sides of the contract
    expect(provider).toContain("glass-distortion");
    expect(provider).toContain("data-glass-lens");
  });

  it("carries the specular edge stack and the cursor glow", () => {
    expect(css).toMatch(/inset 0 1\.5px 0 rgb\(255 255 255 \/ 0\.8\)/);
    expect(css).toMatch(/inset 1px 0 0 rgb\(255 255 255 \/ 0\.22\)/);
    expect(css).toContain("var(--mx");
    expect(css).toMatch(/\.glass::after/);
  });

  it("keeps the pseudo-element layers behind the text", () => {
    // z-index: -1 with isolation on the host is what stops the highlight and
    // the glow from washing over copy
    expect(css).toContain("isolation: isolate");
    const decor = css.match(/z-index: -1;/g) ?? [];
    expect(decor.length).toBeGreaterThanOrEqual(2);
  });

  it("has no CSS-Modules syntax left in a global stylesheet", () => {
    expect(css).not.toMatch(/^\s*composes:/m);
  });

  it("degrades instead of disappearing when blur is unavailable", () => {
    expect(css).toContain("@supports not (");
    expect(css).toContain("prefers-reduced-transparency");
    expect(css).toMatch(/background-color: color-mix\(in srgb/);
  });
});

describe("ambient backdrop", () => {
  it("puts light behind the glass, below all content", () => {
    expect(aurora).toMatch(/\.aurora\s*\{/);
    expect(aurora).toMatch(/position:\s*fixed/);
    expect(aurora).toMatch(/z-index:\s*-1/);
    // several independent drifts, all slow
    const drifts = aurora.match(/@keyframes aurora-drift-/g) ?? [];
    expect(drifts.length).toBeGreaterThanOrEqual(4);
    expect(aurora).toMatch(/prefers-reduced-motion/);
  });
});
