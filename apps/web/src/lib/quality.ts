/**
 * Device-aware quality tiers for the 3D scenes and heavy effects.
 * Evaluated once on the client; SSR always gets the conservative default.
 */

export type QualityTier = "low" | "medium" | "high";

export interface QualityProfile {
  tier: QualityTier;
  /** devicePixelRatio clamp for the WebGL canvas */
  dpr: [number, number];
  /** instanced brick count for the masonry wall */
  wall_bricks: number;
  /** enable light-costing transmission material features */
  refraction: boolean;
  /** enable pointer parallax + idle float */
  interaction: boolean;
}

const PROFILES: Record<QualityTier, QualityProfile> = {
  low: {
    tier: "low",
    dpr: [1, 1.25],
    wall_bricks: 24,
    refraction: false,
    interaction: false,
  },
  medium: {
    tier: "medium",
    dpr: [1, 1.5],
    wall_bricks: 42,
    refraction: true,
    interaction: true,
  },
  high: {
    tier: "high",
    dpr: [1, 1.75],
    wall_bricks: 63,
    refraction: true,
    interaction: true,
  },
};

/** Outcome of the single WebGL probe this module performs. */
export interface WebGLCapabilities {
  /** a usable WebGL context can be created in this browser, right now */
  supported: boolean;
  /** the only renderer on offer is a software rasteriser */
  software: boolean;
}

const NO_WEBGL: WebGLCapabilities = { supported: false, software: false };

let capabilities: WebGLCapabilities | null = null;

/**
 * isWebglAvailable — can this browser hand out a WebGL context at all?
 *
 * Hardware acceleration switched off, a blocked or sandboxed GPU process, and
 * an exhausted per-page context budget all make getContext() return null and
 * fire `webglcontextcreationerror`. three.js only finds out once it is already
 * holding the page's canvas, which is exactly what surfaces as
 * "THREE.WebGLRenderer: A WebGL context could not be created". Callers ask
 * here first and render the CSS composition when the answer is no.
 */
export function isWebglAvailable(): boolean {
  return probeWebgl().supported;
}

/** True when the only renderer on offer is software (SwiftShader, llvmpipe). */
export function isSoftwareRenderer(): boolean {
  return probeWebgl().software;
}

/** Forget the cached verdict — for tests, or after a GPU/device change. */
export function resetWebglProbeCache(): void {
  capabilities = null;
}

function probeWebgl(): WebGLCapabilities {
  if (capabilities) return capabilities;
  capabilities = evaluateWebgl();
  return capabilities;
}

/**
 * Asks for one throwaway context and hands it straight back.
 *
 * The attributes mirror what the story canvas will request: a browser that
 * refuses those specific attributes is as unusable to three.js as one that
 * refuses WebGL outright (it throws "…with your selected attributes"), so the
 * probe has to fail when the real allocation would.
 */
function evaluateWebgl(): WebGLCapabilities {
  if (typeof window === "undefined" || !window.WebGLRenderingContext) {
    return NO_WEBGL;
  }

  let gl: WebGLRenderingContext | null = null;
  try {
    const canvas = document.createElement("canvas");
    const attributes: WebGLContextAttributes = {
      alpha: true,
      depth: true,
      stencil: true,
      antialias: true,
      powerPreference: "high-performance",
      failIfMajorPerformanceCaveat: false,
    };
    const getContext = canvas.getContext.bind(canvas) as (
      name: string,
      attributes?: WebGLContextAttributes,
    ) => WebGLRenderingContext | null;

    gl =
      getContext("webgl2", attributes) ??
      getContext("experimental-webgl2", attributes) ??
      getContext("webgl", attributes) ??
      getContext("experimental-webgl", attributes);

    if (!gl || typeof gl.getParameter !== "function") return NO_WEBGL;
    // Some drivers hand back a context that is already dead on arrival.
    if (typeof gl.isContextLost === "function" && gl.isContextLost()) {
      return NO_WEBGL;
    }

    let software = false;
    const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
    if (debugInfo) {
      const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      software =
        typeof renderer === "string" &&
        /swiftshader|llvmpipe|software/i.test(renderer);
    }
    return { supported: true, software };
  } catch {
    return NO_WEBGL;
  } finally {
    // Hand the probe context straight back: a page may only hold a limited
    // number of live contexts, and this one is never drawn into.
    try {
      gl?.getExtension("WEBGL_lose_context")?.loseContext();
    } catch {
      // Nothing to release.
    }
  }
}

export function detectQualityTier(): QualityTier {
  if (typeof window === "undefined") return "low";

  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean };
  };

  if (nav.connection?.saveData) return "low";

  // With no GPU-backed context the canvas is never mounted at all; software
  // rendering is the other reason to stay on the lightest profile.
  const caps = probeWebgl();
  if (!caps.supported || caps.software) return "low";

  const cores = navigator.hardwareConcurrency ?? 4;
  const memory = nav.deviceMemory ?? 4;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const smallViewport = window.innerWidth < 768;

  if (cores <= 4 || memory <= 4 || (coarse && smallViewport)) return "medium";
  if (coarse || smallViewport) return "medium";
  return "high";
}

export function getQualityProfile(tier: QualityTier): QualityProfile {
  return PROFILES[tier];
}
