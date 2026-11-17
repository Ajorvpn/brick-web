/**
 * Deterministic randomness for the asset bake.
 *
 * Every number the bake emits must be reproducible from a seed alone: the
 * committed textures and the committed scene layout are two halves of the
 * same wall, and a re-run with the same seed has to produce a byte-identical
 * set of files (modulo encoder version). No Math.random anywhere.
 */

export const lerp = (a, b, t) => a + (b - a) * t;
export const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
export const smoothstep = (e0, e1, x) => {
  const t = clamp01((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};

/** mulberry32 — small, fast, seedable. */
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Integer hash → [0,1). Stable across platforms (all ops are 32-bit). */
export function hash2i(ix, iy, seed = 0) {
  let h =
    Math.imul(ix | 0, 0x27d4eb2d) ^
    Math.imul(iy | 0, 0x165667b1) ^
    Math.imul(seed | 0, 0x9e3779b1);
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

const wrap = (v, p) => ((v % p) + p) % p;

/** Tileable value noise. `px`/`py` are lattice periods, so the field wraps. */
export function valueNoise(x, y, seed, px, py) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const fx = x - xi;
  const fy = y - yi;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const at = (a, b) => hash2i(wrap(a, px), wrap(b, py), seed);
  const a = at(xi, yi);
  const b = at(xi + 1, yi);
  const c = at(xi, yi + 1);
  const d = at(xi + 1, yi + 1);
  return lerp(lerp(a, b, ux), lerp(c, d, ux), uy);
}

/** Fractal sum of tileable value noise. Normalised to [0,1]. */
export function fbm(x, y, seed, px, py, octaves = 4, gain = 0.5) {
  let sum = 0;
  let amp = 1;
  let norm = 0;
  let fx = x;
  let fy = y;
  let sx = px;
  let sy = py;
  for (let o = 0; o < octaves; o++) {
    sum += amp * valueNoise(fx, fy, seed + o * 101, sx, sy);
    norm += amp;
    amp *= gain;
    fx *= 2;
    fy *= 2;
    sx *= 2;
    sy *= 2;
  }
  return sum / norm;
}

/**
 * Tileable Worley / Voronoi: returns { f1, f2, id } for the two nearest
 * feature points. f2 - f1 is the classic crack field (≈0 on a cell border).
 */
export function voronoi(x, y, seed, cells) {
  const gx = Math.floor(x);
  const gy = Math.floor(y);
  let f1 = 1e9;
  let f2 = 1e9;
  let id = 0;
  for (let oy = -1; oy <= 1; oy++) {
    for (let ox = -1; ox <= 1; ox++) {
      const cx = gx + ox;
      const cy = gy + oy;
      const wx = wrap(cx, cells);
      const wy = wrap(cy, cells);
      const jx = 0.15 + 0.7 * hash2i(wx, wy, seed);
      const jy = 0.15 + 0.7 * hash2i(wx, wy, seed + 977);
      const px = cx + jx;
      const py = cy + jy;
      const dx = px - x;
      const dy = py - y;
      const d = dx * dx + dy * dy;
      if (d < f1) {
        f2 = f1;
        f1 = d;
        id = hash2i(wx, wy, seed + 31);
      } else if (d < f2) {
        f2 = d;
      }
    }
  }
  return { f1: Math.sqrt(f1), f2: Math.sqrt(f2), id };
}

/** sRGB hex → linear-ish [r,g,b] in 0..1 (for grading maths only). */
export function hex(h) {
  const n = parseInt(h.replace("#", ""), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

export const mix3 = (a, b, t) => [
  lerp(a[0], b[0], t),
  lerp(a[1], b[1], t),
  lerp(a[2], b[2], t),
];

/** Multiply saturation (0 = grey, 1 = unchanged, >1 = richer). */
export function saturate(c, s) {
  const l = 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2];
  return [
    clamp01(l + (c[0] - l) * s),
    clamp01(l + (c[1] - l) * s),
    clamp01(l + (c[2] - l) * s),
  ];
}

export const scale3 = (c, k) => [c[0] * k, c[1] * k, c[2] * k];

export function to8(c) {
  return [
    Math.round(clamp01(c[0]) * 255),
    Math.round(clamp01(c[1]) * 255),
    Math.round(clamp01(c[2]) * 255),
  ];
}

/** Convert an sRGB 0..1 triple to a perceptual "value" used by grading. */
export const luma = (c) => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];

/** Blend a colour toward another by a factor, in a mul/lerp-safe way. */
export function tint(c, colour, amount) {
  return [
    clamp01(lerp(c[0], colour[0], amount)),
    clamp01(lerp(c[1], colour[1], amount)),
    clamp01(lerp(c[2], colour[2], amount)),
  ];
}

/** Rotate hue in degrees (approximate, cheap, good enough for clay grading). */
export function hueRotate(c, deg) {
  const a = (deg * Math.PI) / 180;
  const ca = Math.cos(a);
  const sa = Math.sin(a);
  const m = [
    0.213 + ca * 0.787 - sa * 0.213,
    0.715 - ca * 0.715 - sa * 0.715,
    0.072 - ca * 0.072 + sa * 0.928,
    0.213 - ca * 0.213 + sa * 0.143,
    0.715 + ca * 0.285 + sa * 0.14,
    0.072 - ca * 0.072 - sa * 0.283,
    0.213 - ca * 0.213 - sa * 0.787,
    0.715 - ca * 0.715 + sa * 0.715,
    0.072 + ca * 0.928 + sa * 0.072,
  ];
  return [
    clamp01(c[0] * m[0] + c[1] * m[1] + c[2] * m[2]),
    clamp01(c[0] * m[3] + c[1] * m[4] + c[2] * m[5]),
    clamp01(c[0] * m[6] + c[1] * m[7] + c[2] * m[8]),
  ];
}