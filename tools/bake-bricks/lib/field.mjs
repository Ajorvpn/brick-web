/**
 * Scalar fields and separable blur — the primitives every baked map is
 * built from. A "field" is a Float32Array of width*height values in 0..1,
 * sampled with row-major indexing (x fastest).
 */

export function field(w, h, fill = 0) {
  const f = new Float32Array(w * h);
  if (fill) f.fill(fill);
  return f;
}

/** Map a generator (x, y) → value over the whole field. */
export function generate(w, h, fn) {
  const f = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      f[y * w + x] = fn(x, y);
    }
  }
  return f;
}

/** Separable box blur, run three times → very close to a gaussian. */
export function blur(src, w, h, radius) {
  if (radius <= 0) return Float32Array.from(src);
  let a = Float32Array.from(src);
  let b = new Float32Array(w * h);
  const r = Math.max(1, Math.round(radius));
  const inv = 1 / (r * 2 + 1);
  for (let pass = 0; pass < 3; pass++) {
    // horizontal
    for (let y = 0; y < h; y++) {
      const row = y * w;
      for (let x = 0; x < w; x++) {
        let sum = 0;
        for (let k = -r; k <= r; k++) {
          const xx = x + k < 0 ? 0 : x + k >= w ? w - 1 : x + k;
          sum += a[row + xx];
        }
        b[row + x] = sum * inv;
      }
    }
    // vertical
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let sum = 0;
        for (let k = -r; k <= r; k++) {
          const yy = y + k < 0 ? 0 : y + k >= h ? h - 1 : y + k;
          sum += b[yy * w + x];
        }
        a[y * w + x] = sum * inv;
      }
    }
  }
  return a;
}

export function normalize(f) {
  let lo = Infinity;
  let hi = -Infinity;
  for (let i = 0; i < f.length; i++) {
    if (f[i] < lo) lo = f[i];
    if (f[i] > hi) hi = f[i];
  }
  const span = hi - lo || 1;
  const out = new Float32Array(f.length);
  for (let i = 0; i < f.length; i++) out[i] = (f[i] - lo) / span;
  return out;
}

export function stretch(f, lo, hi) {
  const out = new Float32Array(f.length);
  const span = hi - lo || 1;
  for (let i = 0; i < f.length; i++) {
    const v = (f[i] - lo) / span;
    out[i] = v < 0 ? 0 : v > 1 ? 1 : v;
  }
  return out;
}

/** dst = max(dst, src) — how every stamp is unioned onto a face. */
export function maxInto(dst, src) {
  for (let i = 0; i < dst.length; i++) if (src[i] > dst[i]) dst[i] = src[i];
  return dst;
}

export function addScaled(dst, src, k) {
  for (let i = 0; i < dst.length; i++) dst[i] += src[i] * k;
  return dst;
}

/** Sample a field with clamp-to-edge bilinear filtering. */
export function sample(f, w, h, x, y) {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = x - x0;
  const fy = y - y0;
  const at = (xx, yy) => {
    const cx = xx < 0 ? 0 : xx >= w ? w - 1 : xx;
    const cy = yy < 0 ? 0 : yy >= h ? h - 1 : yy;
    return f[cy * w + cx];
  };
  const a = at(x0, y0);
  const b = at(x0 + 1, y0);
  const c = at(x0, y0 + 1);
  const d = at(x0 + 1, y0 + 1);
  return (a + (b - a) * fx) * (1 - fy) + (c + (d - c) * fx) * fy;
}

/** Resample a field into a different resolution (box average, down only). */
export function resample(src, sw, sh, dw, dh) {
  const out = new Float32Array(dw * dh);
  for (let y = 0; y < dh; y++) {
    for (let x = 0; x < dw; x++) {
      out[y * dw + x] = sample(src, sw, sh, (x * sw) / dw, (y * sh) / dh);
    }
  }
  return out;
}