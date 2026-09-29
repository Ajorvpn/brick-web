import { afterEach, describe, expect, it, vi } from "vitest";
import {
  detectQualityTier,
  getQualityProfile,
  isSoftwareRenderer,
  isWebglAvailable,
  resetWebglProbeCache,
  type QualityTier,
} from "./quality";

describe("quality profiles", () => {
  it.each<QualityTier>(["low", "medium", "high"])(
    "%s profile has valid dpr and wall brick counts",
    (tier) => {
      const p = getQualityProfile(tier);
      expect(p.tier).toBe(tier);
      expect(p.dpr[0]).toBeGreaterThan(0);
      expect(p.dpr[1]).toBeGreaterThanOrEqual(p.dpr[0]);
      expect(p.wall_bricks).toBeGreaterThan(0);
    },
  );

  it("scales wall complexity by tier", () => {
    const low = getQualityProfile("low");
    const medium = getQualityProfile("medium");
    const high = getQualityProfile("high");
    expect(low.wall_bricks).toBeLessThan(medium.wall_bricks);
    expect(medium.wall_bricks).toBeLessThan(high.wall_bricks);
    expect(low.refraction).toBe(false);
    expect(high.refraction).toBe(true);
  });
});

describe("webgl capability probe", () => {
  afterEach(() => {
    resetWebglProbeCache();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("reports no WebGL where there is no GL binding, and stays on low", () => {
    // jsdom ships no WebGL implementation — the environment the site must
    // survive in tests, and the one a GPU-disabled browser behaves like.
    expect(isWebglAvailable()).toBe(false);
    expect(isSoftwareRenderer()).toBe(false);
    expect(detectQualityTier()).toBe("low");
  });

  it("reports support and hands the probe context straight back", () => {
    const { loseContext } = mock_gl_context({ renderer: "ANGLE (NVIDIA GeForce RTX 4060)" });

    expect(isWebglAvailable()).toBe(true);
    expect(isSoftwareRenderer()).toBe(false);
    expect(loseContext).toHaveBeenCalledTimes(1);
  });

  it("probes once, however many callers ask", () => {
    const { getContext } = mock_gl_context({ renderer: "ANGLE (AMD Radeon Graphics)" });

    isWebglAvailable();
    isSoftwareRenderer();
    detectQualityTier();

    // webgl2 answers on the first try, and the verdict is cached after that.
    expect(getContext).toHaveBeenCalledTimes(1);
    expect(getContext).toHaveBeenCalledWith("webgl2", expect.objectContaining({ antialias: true }));
  });

  it("flags software rasterisers so the lightest profile is used", () => {
    mock_gl_context({ renderer: "Google SwiftShader" });

    expect(isWebglAvailable()).toBe(true);
    expect(isSoftwareRenderer()).toBe(true);
    expect(detectQualityTier()).toBe("low");
  });

  it("treats a context that is already lost as no WebGL at all", () => {
    mock_gl_context({ renderer: "ANGLE (Intel UHD)", lost: true });

    expect(isWebglAvailable()).toBe(false);
    expect(detectQualityTier()).toBe("low");
  });

  it("does not force the lowest tier when real WebGL is available", () => {
    mock_gl_context({ renderer: "ANGLE (NVIDIA GeForce RTX 4060)" });

    expect(detectQualityTier()).not.toBe("low");
  });
});

/**
 * Stands in for a browser WebGL binding: enough surface for the probe to read
 * the unmasked renderer and release the context, nothing more.
 */
function mock_gl_context({
  renderer,
  lost = false,
}: {
  renderer: string;
  lost?: boolean;
}) {
  const loseContext = vi.fn();
  const gl = {
    getParameter: vi.fn(() => renderer),
    isContextLost: vi.fn(() => lost),
    getExtension: vi.fn((name: string) => {
      if (name === "WEBGL_debug_renderer_info") {
        return { UNMASKED_RENDERER_WEBGL: 0x9245 };
      }
      if (name === "WEBGL_lose_context") return { loseContext };
      return null;
    }),
  };

  vi.stubGlobal("WebGLRenderingContext", class {});
  const getContext = vi
    .spyOn(HTMLCanvasElement.prototype, "getContext")
    .mockReturnValue(gl as unknown as WebGLRenderingContext);

  return { gl, getContext, loseContext };
}

