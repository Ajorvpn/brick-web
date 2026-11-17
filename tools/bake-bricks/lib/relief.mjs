/**
 * Height → surface maps. Everything that reads as "relief" in the scene
 * (stamped emblems, chips, arris wear, glaze crazing) comes out of these
 * three functions, so the light direction baked into the albedo and the
 * light direction in the scene can never disagree.
 */

import { blur } from "./field.mjs";

/** Wrap index (brick faces tile horizontally; vertical wrap is harmless). */
const wrap = (v, n) => (v < 0 ? v + n : v >= n ? v - n : v);

/**
 * heightToNormal — Sobel gradient → tangent-space normal, encoded RGB.
 * +Z is out of the face; light comes from upper-left of the *scene*, which
 * means the height field is shaded as if lit from the left/top.
 */
export function heightToNormal(height, w, h, strength = 4) {
  const out = new Uint8Array(w * h * 3);
  const at = (x, y) => height[wrap(y, h) * w + wrap(x, w)];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const tl = at(x - 1, y - 1);
      const t = at(x, y - 1);
      const tr = at(x + 1, y - 1);
      const l = at(x - 1, y);
      const r = at(x + 1, y);
      const bl = at(x - 1, y + 1);
      const b = at(x, y + 1);
      const br = at(x + 1, y + 1);
      const dx = tl + 2 * l + bl - (tr + 2 * r + br);
      const dy = tl + 2 * t + tr - (bl + 2 * b + br);
      let nx = dx * strength;
      let ny = dy * strength;
      let nz = 1;
      const len = Math.hypot(nx, ny, nz) || 1;
      nx /= len;
      ny /= len;
      nz /= len;
      const i = (y * w + x) * 3;
      out[i] = Math.round((nx * 0.5 + 0.5) * 255);
      out[i + 1] = Math.round((ny * 0.5 + 0.5) * 255);
      out[i + 2] = Math.round((nz * 0.5 + 0.5) * 255);
    }
  }
  return out;
}

/**
 * heightToAO — cheap cavity term: how far a point sits below its blurred
 * surroundings. Debossed stamps and chips go dark; open faces stay white.
 */
export function heightToAO(height, w, h, radius = 6, strength = 2.2) {
  const low = blur(height, w, h, radius);
  const out = new Uint8Array(w * h * 3);
  for (let i = 0; i < w * h; i++) {
    const cavity = Math.max(0, low[i] - height[i]);
    const v = Math.max(0, Math.min(1, 1 - cavity * strength));
    const g = Math.round(v * 255);
    out[i * 3] = g;
    out[i * 3 + 1] = g;
    out[i * 3 + 2] = g;
  }
  return out;
}

/**
 * heightToShade — soft directional light multiplied into the albedo.
 * Baking a little of the relief's shading into colour is what keeps the
 * wall reading at a distance, where the normal map's contribution is tiny.
 */
export function heightToShade(height, w, h, strength = 0.55) {
  const out = new Float32Array(w * h);
  const at = (x, y) => height[wrap(y, h) * w + wrap(x, w)];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = at(x - 1, y) - at(x + 1, y);
      const dy = at(x, y - 1) - at(x, y + 1);
      // light from upper-left, matching the scene's key light
      const lit = dx * 0.7 + dy * 0.7;
      out[y * w + x] = 1 + lit * strength;
    }
  }
  return out;
}

/** Rounded-rect mask with soft edge, in pixel space. Used for face borders. */
export function roundedMask(w, h, inset, radius, feather = 1.5) {
  const out = new Float32Array(w * h);
  const cx0 = inset;
  const cx1 = w - inset;
  const cy0 = inset;
  const cy1 = h - inset;
  const r = Math.min(radius, (cx1 - cx0) / 2, (cy1 - cy0) / 2);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const px = x + 0.5;
      const py = y + 0.5;
      // signed distance to a rounded rectangle
      const qx = Math.abs(px - (cx0 + cx1) / 2) - ((cx1 - cx0) / 2 - r);
      const qy = Math.abs(py - (cy0 + cy1) / 2) - ((cy1 - cy0) / 2 - r);
      const d =
        Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) +
        Math.min(Math.max(qx, qy), 0) -
        r;
      out[y * w + x] = 1 - Math.min(1, Math.max(0, (d + feather) / (feather * 2)));
    }
  }
  return out;
}